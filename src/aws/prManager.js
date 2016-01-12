'use strict';
const Q = require('q');
const Subnet = require('./subnetManager');
const SG = require('./securityGroupManager');
const Ec2 = require('./ec2Manager');
const rid = require('./../resourceIdentifier');
const Cluster = require('./clusterManager');
const Route53 = require('./route53Manager');
const Task = require('./taskServiceManager');
const common = require('./common');
const path = require('path');
const constants = require('../constants');
const util = require('../util');
const elbFns = require('./elb/elb');
const R = require('ramda');
const Config = require('../config');

function getPRManager(ec2, ecs, r53, awsElb, vpcId, zoneId) {
  var subnet = Subnet(ec2, vpcId);
  var securityGroup = SG(ec2, vpcId);
  var cluster = Cluster(ecs);
  var route53 = Route53(r53, zoneId);
  var ec2mgr = Ec2(ec2, vpcId);
  var task = Task(ecs);
  var config = require('../config')();
  var elb = R.mapObjIndexed(elbAwsPartial, elbFns);

  function elbAwsPartial(fn) {
    if (typeof fn !== 'function') {
      return () => {};
    }
    return R.partial(fn, { elb: util.makePromiseApi(awsElb) });
  }

  function createEc2(creq) {
    return ec2mgr
      .createPr({
        clusterName: creq.name,
        pid: creq.projectId,
        pr: creq.pr,
        sgId: creq.groupId,
        subnetId: creq.subnetId,
        sshPath: creq.sshData || path.join('.private',
          constants.SSH_PUBLIC_PATH),
        apiConfig: {}
      });
  }

  function createElb(creq) {
    return elb.createPr(creq.projectId, creq.pr, creq.subnetId,
      creq.groupId, constants.AWS_SSL_ID, creq.useInternalSSL);
  }

  function setUrl(creq) {
    return route53
      .createPRCNameRecord(creq.projectId, creq.pr, creq.dns)
      .then((r53result) => {
        creq.url = r53result;
        return creq;
      });
  }

  /**
   * @param {Object} creq
   * @returns {Q.Promise<{{ groupId: string }}>}
   */
  function setGroupId(creq) {
    return securityGroup
      .createPr(creq.projectId, creq.pr)
      .then((groupId) => {
        creq.groupId = groupId;
        return creq;
      });
  }

  /**
   * @param {string} projectId
   * @param {string} pr
   * @param {Object} appDef
   * @param {string[]|string} sshKeys
   * @param {boolean=} useInternalSSL
   * @returns {Request|Promise.<T>|*}
   */
  function create(projectId, pr, appDef, sshKeys, useInternalSSL) {
    const creq = {
      projectId,
      pr: pr + '',
      appDef,
      sshPath: sshKeys || '',
      useInternalSSL,
      name: rid.generateRID({ pid: projectId, pr })
    };

    return common
      .setSubnet(subnet, creq)
      .then(() => Q
        .all([
          setGroupId(creq),
          cluster.create(creq.name) ])
        .then(() => creq))
      .then(() => common.createElbEc2(createElb, createEc2, creq))
      .then(() => common.createTask(task, creq))
      .then(() => common.registerEc2ToElb(elb, creq))
      .then(setUrl)
      .then((creq) => common.qualifyUrl(Config(), creq.url));
  }

  /**
   * @param {string} projectId
   * @param {string} pr
   * @param {string} clusterName
   * @returns {Promise.<string[]>}
   */
  function destroyEc2(projectId, pr, clusterName) {
    if (!clusterName) {
      throw new Error('destroyEc2: requires valid clusterName');
    }
    return cluster
      .listContainers(clusterName)
      .then((result) => Q
        .all(result.map(common.getDeregisterClusterFn(cluster, clusterName)))
        .then(() => ec2mgr
          .destroyPr(projectId, pr)
          .fail((err) => util
            .info(`PR Destruction Problem Destroying Ec2: ${err.message}`))
        )
      );
  }

  /**
   * @param {string} projectId
   * @param {string} pr
   * @returns {Request|Promise.<T>}
   */
  function destroyRoutes(projectId, pr) {
    return ec2mgr.describePr(projectId, pr)
      .then((results) => route53
        .destroyPRARecord(
          projectId, pr, common.findIpFromEc2Describe(results)));
  }

  /**
   * @param {string} projectId
   * @param {string} pr
   * @returns {Q.Promise}
   */
  function destroyElb(projectId, pr) {
    return elb.destroyPr(projectId, pr)
      //fail over
      .fail((err) => util.warn(err));
  }

  /**
   * @param {string} projectId
   * @param {string} pr
   * @returns {Request}
   */
  function destroy(projectId, pr) {
    var clusterName = rid.generateRID({
      pid: projectId,
      pr: pr
    });
    return destroyRoutes(projectId, pr)
      .then(() => destroyEc2(projectId, pr, clusterName),
        () => destroyEc2(projectId, pr, clusterName))
      .then(() => destroyElb(projectId, pr))
      .then((r) => task
        .destroy(clusterName)
        .fail((err) => {
          util.info(`PR Destruction Problem Destroying Task: ${err.message}`);
          return r;
        }))
      .then(() => cluster
        .destroy(clusterName)
        .fail(() => undefined))
      .then(() => securityGroup
        .destroyPr(projectId, pr));
  }

  return {
    create: create,
    destroy: destroy
  };
}

module.exports = getPRManager;

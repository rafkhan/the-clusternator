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

function getPRManager(ec2, ecs, r53, vpcId, zoneId) {
  var subnet = Subnet(ec2, vpcId);
  var securityGroup = SG(ec2, vpcId);
  var cluster = Cluster(ecs);
  var route53 = Route53(r53, zoneId);
  var ec2mgr = Ec2(ec2, vpcId);
  var task = Task(ecs);
  var config = require('../config')();

  function qualifyUrl(url) {
    var tld = config.tld || '.example.com';
    if (tld[0] !== '.') {
      tld = `.${tld}`;
    }
    return url + tld;
  }

  function createCluster(subnetId, pid, pr, appDef, sshData) {
    var clusterName = rid.generateRID({
      pid: pid,
      pr: pr
    }), urlData = { url: '' };

    return Q
      .all([
        securityGroup.createPr(pid, pr),
        cluster.create(clusterName)
      ])
      .then((results) => ec2mgr
        .createPr({
          clusterName: clusterName,
          pid: pid,
          pr: pr,
          sgId: results[0].GroupId,
          subnetId: subnetId,
          sshPath: sshData || path.join('.private', constants.SSH_PUBLIC_PATH),
          apiConfig: {}
        })
        .then((ec2Results) => route53
          .createPRARecord(pid, pr, common.findIpFromEc2Describe(ec2Results))
          .then((url) => {
            urlData.url = qualifyUrl(url);
          })))
      .then(() => task
        .create(clusterName, clusterName, appDef))
      .then(() => urlData);
    //- start system
  }

  /**
   * @param {string} projectId
   * @param {string} pr
   * @param {Object} appDef
   * @param {Array=} sshData
   * @returns {Request|Promise.<T>}
   */
  function create(projectId, pr, appDef, sshData) {

    return subnet.describeProject(projectId).then((list) => {
      if (!list.length) {
        throw new Error('Create Pull Request failed, no subnet found for ' +
          'Project: ' + projectId + ' Pull Request # ' + pr);
      }
      return createCluster(list[0].SubnetId, projectId, pr, appDef, sshData);
    });
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

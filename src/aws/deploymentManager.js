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
const constants = require('../constants');
const path = require('path');
const util = require('../util');
const elbFns = require('./elb/elb');
const R = require('ramda');

function getDeploymentManager(ec2, ecs, r53, awsElb, vpcId, zoneId) {
  var subnet = Subnet(ec2, vpcId);
  var securityGroup = SG(ec2, vpcId);
  var cluster = Cluster(ecs);
  var route53 = Route53(r53, zoneId);
  var ec2mgr = Ec2(ec2, vpcId);
  var task = Task(ecs);
  var elb = R.mapObjIndexed(elbAwsPartial, elbFns);

  function elbAwsPartial(fn) {
    if (typeof fn !== 'function') {
      return () => {};
    }
    return R.partial(fn, { elb: util.makePromiseApi(awsElb) });
  }

  function createEc2(groupId, clusterName, pid, deployment, subnetId, sha) {
    return ec2mgr.createDeployment({
        clusterName: clusterName,
        pid: pid,
        deployment: deployment,
        sha: sha,
        sgId: groupId,
        subnetId: subnetId,
        sshPath: path.join('.private', constants.SSH_PUBLIC_PATH),
        apiConfig: {}
      });
  }

  function getIdFromEc2Results(results) {
    if (!results[0]) {
      throw new Error('createPR: unexpected EC2 create results');
    }
    var instanceId = '';
    results[0].Instances.forEach((inst) => {
       instanceId = inst.InstanceId;
    });
    return instanceId;
  }

  function createElbEc2(groupId, clusterName, pid, deployment, subnetId, sha,
                        useInternalSSL) {
    return Q
      .all([
        createEc2(groupId, clusterName, pid, deployment, subnetId, sha),
        elb.createDeployment(pid, deployment, subnetId, groupId,
          constants.AWS_SSL_ID, useInternalSSL) ])
      .then((results) => route53
        .createDeploymentCNameRecord(
          pid, deployment, results[1].dns)
        .then((r53result) => {
          return {
            url: r53result,
            elbId: results[1].id,
            elbDns: results[1].dns,
            ec2Info: results[0]
          };
        }));
  }

  function createEc2Solo(groupId, clusterName, pid, deployment, subnetId, sha) {
    return createEc2(groupId, clusterName, pid, deployment, subnetId, sha)
      .then((ec2Results) => route53
        .createDeploymentARecord(
          pid, deployment, common.findIpFromEc2Describe(ec2Results))
        .then((urlDesc) => urlDesc)
        // fail over
        .fail(() => undefined));
  }

  /**
   * @param {string} subnetId
   * @param {string} pid
   * @param {string} deployment
   * @param {string} sha
   * @param {Object} appDef
   * @param {boolean=} useInternalSSL
   * @returns {Request}
   */
  function createCluster(subnetId, pid, deployment, sha, appDef,
                         useInternalSSL) {
    var clusterName = rid.generateRID({
      pid,
      deployment,
      sha
    });

    return Q
      .all([
        securityGroup.createDeployment(pid, deployment, sha),
        cluster.create(clusterName)
      ])
      .then((results) => createElbEc2(results[0].GroupId, clusterName, pid,
        deployment, subnetId, sha, useInternalSSL))
      .then((elbRes) => task
        .create(clusterName, clusterName, appDef)
        .then(() => elb.registerInstances(
          elbRes.elbId, [getIdFromEc2Results(elbRes.ec2Info)]))
        .then(() => elbRes.url));
  }

  /**
   * @param {string} projectId
   * @param {string} deployment
   * @param {string} sha
   * @param {Object} appDef
   * @param {boolean=} useInternalSSL
   * @returns {Request|Promise.<T>|*}
   */
  function create(projectId, deployment, sha, appDef, useInternalSSL) {
    return subnet
      .describeProject(projectId)
      .then((list) => {
        if (!list.length) {
          throw new Error('Create Deployment failed, no subnet found for ' +
            `Project: ${projectId} Deployment ${deployment}`);
        }
        return createCluster(
          list[0].SubnetId, projectId, deployment, sha, appDef, useInternalSSL);
      });
  }

  /**
   * @param {string} projectId
   * @param {string} deployment
   * @param {string} clusterName
   * @returns {Promise.<string[]>}
   */
  function destroyEc2(projectId, deployment, clusterName) {
    if (!clusterName) {
      throw new Error('destroyEc2: requires valid clusterName');
    }
    return cluster
      .listContainers(clusterName)
      .then((result) => Q
        .all(result.map(common.getDeregisterClusterFn(cluster, clusterName)))
        .then(() => ec2mgr
          .destroyDeployment(projectId, deployment)
          .fail((err) => {
            util.info('Deployment Destruction Problem Destroying Ec2: ' +
              err.message);
          })));
  }

  /**
   * @param {string} projectId
   * @param {string} deployment
   * @returns {Request|Promise.<T>}
   */
  function destroyRoutes(projectId, deployment) {
    return elb.describeDeployment(projectId, deployment)
      .then((result) => route53
        .destroyDeploymentCNameRecord(projectId, deployment, result.dns));
  }

  function destroyElb(projectId, deployment) {
    return elb.destroyDeployment(projectId, deployment)
      //fail over
      .fail((err) => util.warn(err));
  }

  /**
   * @param {string} projectId
   * @param {string} deployment
   * @param {string} sha
   * @returns {Request}
   */
  function destroy(projectId, deployment, sha) {
    var clusterName = rid.generateRID({
      pid: projectId,
      deployment,
      sha
    });
    return destroyRoutes(projectId, deployment)
      .then(() => destroyEc2(projectId, deployment, clusterName),
        () => destroyEc2(projectId, deployment, clusterName))
      .then(() => destroyElb(projectId, deployment))
      .then((r) => task
        .destroy(clusterName)
        .fail((err) => {
          util.info('Deployment Destruction Problem Destroying Task: ' +
            err.message);
        }))
      .then(() => cluster
        .destroy(clusterName)
        // fail over
        .fail(() => undefined))
      .then(() => securityGroup
        .destroyDeployment(projectId, deployment)
        // fail over
        .fail(() => undefined));
  }

  return {
    create: create,
    destroy: destroy
  };
}

module.exports = getDeploymentManager;

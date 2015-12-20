'use strict';
var Q = require('q'),
  Subnet = require('./subnetManager'),
  SG = require('./securityGroupManager'),
  Ec2 = require('./ec2Manager'),
  rid = require('./../resourceIdentifier'),
  Cluster = require('./clusterManager'),
  Route53 = require('./route53Manager'),
  Task = require('./taskServiceManager'),
  common = require('./common'),
  constants = require('../constants'),
  path = require('path'),
  util = require('../util');

function getDeploymentManager(ec2, ecs, r53, vpcId, zoneId) {
  var subnet = Subnet(ec2, vpcId),
    securityGroup = SG(ec2, vpcId),
    cluster = Cluster(ecs),
    route53 = Route53(r53, zoneId),
    ec2mgr = Ec2(ec2, vpcId),
    task = Task(ecs);

  /**
   * @param {string} subnetId
   * @param {string} pid
   * @param {string} deployment
   * @param {string} sha
   * @param {Object} appDef
   * @returns {Request}
   */
  function createCluster(subnetId, pid, deployment, sha, appDef) {
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
      .then((results) => ec2mgr
        .createDeployment({
          clusterName: clusterName,
          pid: pid,
          deployment: deployment,
          sha: sha,
          sgId: results[0].GroupId,
          subnetId: subnetId,
          sshPath: path.join('.private', constants.SSH_PUBLIC_PATH),
          apiConfig: {}
        })
        .then((ec2Results) => route53
          .createDeploymentARecord(
            pid, deployment, common.findIpFromEc2Describe(ec2Results))
          .then((urlDesc) => urlDesc)
          // fail over
          .fail(() => undefined)))
      .then((urlDesc) => task
        .create(clusterName, clusterName, appDef)
        .then(() => urlDesc));
    //- start system
  }

  function create(projectId, deployment, sha, appDef) {

    return subnet
      .describeProject(projectId)
      .then((list) => {
        if (!list.length) {
          throw new Error('Create Deployment failed, no subnet found for ' +
            `Project: ${projectId} Deployment ${deployment}`);
        }
        return createCluster(
          list[0].SubnetId, projectId, deployment, sha, appDef);
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
          })
        )
      );
  }

  /**
   * @param {string} projectId
   * @param {string} deployment
   * @returns {Request|Promise.<T>}
   */
  function destroyRoutes(projectId, deployment) {
    return ec2mgr
      .describeDeployment(projectId, deployment)
      .then((results) => {
      var ip = common.findIpFromEc2Describe(results);
      return route53.destroyDeploymentARecord(projectId, deployment, ip);
    });
  }

  /**
   * @param {string} projectId
   * @param {string} deployment
   * @param {string} sha
   * @returns {Request}
   */
  function destroy(projectId, deployment, sha) {
    var clusterName = rid.generateRID({
      projectId,
      deployment,
      sha
    });
    return destroyRoutes(projectId, deployment)
      .then(() => destroyEc2(projectId, deployment, clusterName),
        () => destroyEc2(projectId, deployment, clusterName))
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

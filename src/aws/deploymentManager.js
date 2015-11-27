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

    return Q.all([
      securityGroup.createDeployment(pid, deployment, sha),
      cluster.create(clusterName)
    ]).
    then(function(results) {
      var sgDesc = results[0];

      return ec2mgr.createDeployment({
        clusterName: clusterName,
        pid: pid,
        deployment: deployment,
        sha: sha,
        sgId: sgDesc.GroupId,
        subnetId: subnetId,
        sshPath: '.private/ssh-public',
        apiConfig: {}
      }).then(function(ec2Results) {
        var ip = common.findIpFromEc2Describe(ec2Results);
        return route53.createDeploymentARecord(pid, deployment, ip).fail(() => {
          // fail over
          return;
        });
      });
    }).
    then(function() {
      return task.create(clusterName, clusterName, appDef);
    });
    //- start system
  }

  function create(pid, deployment, sha, appDef) {

    return subnet.describeProject(pid).then(function(list) {
      if (!list.length) {
        throw new Error('Create Deployment failed, no subnet found for ' +
          'Project: ' + pid + ' Deployment ' + deployment);
      }
      return createCluster(list[0].SubnetId, pid, deployment, sha, appDef);
    });
  }

  function destroyEc2(pid, deployment, clusterName) {
    if (!clusterName) {
      throw new Error('destroyEc2: requires valid clusterName');
    }
    return cluster.listContainers(clusterName).then(function(result) {
      var deregisterPromises = [];
      result.forEach(function(arn) {
        deregisterPromises.push(cluster.deregister(
          arn, clusterName
        ).fail(function(err) {
          //util.info('Deployment: destroy EC2: Warning, Deregistration for ' +
          //  'instance ' + arn + ' failed, project: ' + pid + ' deployment ' +
          //  deployment + ' error: ' + err.message);
          // do nothing on failure, deregistration _should_ actually work
          // automagically
        }));
      });
      return Q.all(deregisterPromises).then(function() {
        return ec2mgr.destroyDeployment(pid, deployment).fail(function(err) {
          util.info('Deployment Destruction Problem Destroying Ec2: ' +
            err.message);
        });
      });
    });
  }

  function destroyRoutes(pid, deployment) {
    return ec2mgr.describeDeployment(pid, deployment).then(function(results) {
      var ip = common.findIpFromEc2Describe(results);
      return route53.destroyDeploymentARecord(pid, deployment, ip);
    });
  }

  /**
   * @param {string} pid
   * @param {string} deployment
   * @param {string} sha
   * @returns {Request}
   */
  function destroy(pid, deployment, sha) {
    var clusterName = rid.generateRID({
      pid,
      deployment,
      sha
    });
    return destroyRoutes(pid, deployment).
    then(() => {
      return destroyEc2(pid, deployment, clusterName);
    }, () => {
      return destroyEc2(pid, deployment, clusterName);
    }).then(function(r) {
      return task.destroy(clusterName).fail(function(err) {
        util.info('Deployment Destruction Problem Destroying Task: ' +
          err.message);
        return;
      });
    }).then(function() {
      var clusterName = rid.generateRID({
        pid,
        deployment,
        sha
      });
      return cluster.destroy(clusterName).fail(() => {
        // fail over, keep cleaning
        return;
      });
    }, () => {
      // keep cleaning up
      return;
    }).then(function() {
      return securityGroup.destroyDeployment(pid, deployment).fail(() => {
        // fail over
        return;
      });
    });
  }

  return {
    create: create,
    destroy: destroy
  };
}

module.exports = getDeploymentManager;

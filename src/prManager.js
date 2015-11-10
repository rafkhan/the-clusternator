'use strict';
var Q = require('q'),
  Subnet = require('./aws/subnetManager'),
  SG = require('./aws/securityGroupManager'),
  Ec2 = require('./aws/ec2Manager'),
  rid = require('./resourceIdentifier'),
  Cluster = require('./aws/clusterManager'),
  Route53 = require('./aws/route53Manager'),
  Task = require('./aws/taskServicemanager'),
  util = require('./util');

function getPRManager(ec2, ecs, r53, vpcId, zoneId) {
  var subnet = Subnet(ec2, vpcId),
    securityGroup = SG(ec2, vpcId),
    cluster = Cluster(ecs),
    route53 = Route53(r53, zoneId),
    ec2mgr = Ec2(ec2, vpcId),
    task = Task(ecs);

  function findIpFromEc2Describe(results) {
    /** @todo in the future this might be plural, or more likely it will
    be going through an ELB */
    var ip;
    if (!results[0]) {
      throw new Error('createPR: unexpected EC2 create results');
    }
    results[0].Instances.forEach(function(inst) {
      ip = inst.PublicIpAddress;
    });
    if (!ip) {
      throw new Error('createPR: expecting a public IP address');
    }
    return ip;
  }

  function createCluster(subnetId, pid, pr, appDef) {
    var clusterName = rid.generateRID({
      pid: pid,
      pr: pr
    });

    return Q.all([
      securityGroup.create(pid, pr),
      cluster.create(clusterName)
    ]).
    then(function(results) {
      var sgDesc = results[0];

      return ec2mgr.create({
        clusterName: clusterName,
        pid: pid,
        pr: pr,
        sgId: sgDesc.GroupId,
        subnetId: subnetId,
        apiConfig: {}
      }).then(function(ec2Results) {
        var ip = findIpFromEc2Describe(ec2Results);
        return route53.createPRARecord(pid, pr, ip);
      });
    }).
    then(function() {
      return task.create(clusterName, clusterName, appDef);
    });
    //- start system
  }

  function create(pid, pr, appDef) {

    return subnet.describe().then(function(list) {
      if (!list.length) {
        throw new Error('Create Pull Request failed, no subnet found for ' +
          'Project: ' + pid + ' Pull Request # ' + pr);
      }
      return createCluster(list[0].SubnetId, pid, pr, appDef);
    });
  }

  function destroyEc2(pid, pr, clusterName) {
    if (!clusterName) {
      throw new Error('destroyEc2: requires valid clusterName');
    }
    return cluster.listContainers(clusterName).then(function(result) {
      var deregisterPromises = [];
      result.forEach(function(arn) {
        deregisterPromises.push(cluster.deregister(
          arn, clusterName
        ).fail(function(err) {
          util.plog('PR: destroy EC2: Warning, Deregistration for instance ' +
            arn + ' failed, project: ' + pid + ' pr #' + pr +
            ' error: ' + err.message);
          // do nothing on failure, deregistration _should_ actually work
          // automagically
        }));
      });
      return Q.all(deregisterPromises).then(function() {
        return ec2mgr.destroy(pid, pr).fail(function(err) {
          util.plog('PR Destruction Problem Destroying Ec2: ' + err.message);
        });
      });
    });
  }

  function destroyRoutes(pid, pr) {
    return ec2mgr.describe(pid, pr).then(function(results) {
      var ip = findIpFromEc2Describe(results);
      return route53.destroyPRARecord(pid, pr, ip);
    });
  }

  function destroy(pid, pr) {
    var clusterName = rid.generateRID({
      pid: pid,
      pr: pr
    });
    return destroyRoutes(pid, pr).
    then(function() {
      return destroyEc2(pid, pr, clusterName);
    }).then(function(r) {
      return task.destroy(clusterName).fail(function(err) {
        util.plog('PR Destruction Problem Destroying Task: ' + err.message);
        return r;
      });
    }).then(function() {
      return cluster.destroy({
        pid: pid,
        pr: pr
      });
    }).then(function() {
      return securityGroup.destroy(pid, pr);
    });
  }

  return {
    create: create,
    destroy: destroy
  };
}

module.exports = getPRManager;

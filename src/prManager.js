'use strict';
var Q = require('q'),
  Subnet = require('./aws/subnetManager'),
  SG = require('./aws/securityGroupManager'),
  Ec2 = require('./aws/ec2Manager'),
  rid = require('./resourceIdentifier'),
  Cluster = require('./aws/clusterManager'),
  Task = require('./aws/taskServicemanager');

function getPRManager(ec2, ecs, vpcId) {
  var subnet = Subnet(ec2, vpcId),
    securityGroup = SG(ec2, vpcId),
    cluster = Cluster(ecs),
    ec2mgr = Ec2(ec2, vpcId);

  function createCluster(subnetId, pid, pr) {
    var clusterName = rid.generateRID({
      pid: pid,
      pr: pr
    });

    return Q.all([
      securityGroup.create(pid, pr),
      cluster.create(clusterName)
    ]).
    then(function(results) {
      var sDesc = results[0];

      return ec2mgr.create({
        clusterName: clusterName,
        pid: pid,
        pr: pr,
        sgId: sDesc.GroupId,
        subnetId: subnetId,
        apiConfig: {}
      });
      //- create new ECS task(s)
      //- create new ECS service(s)
      //- create new Route 53 entry to service
      //- start system
    });
  }

  function create(pid, pr) {

    return subnet.describe().then(function(list) {
      if (!list.length) {
        throw new Error('Create Pull Request failed, no subnet found for ' +
        'Project: ' + pid + ' PulL Request # ' + pr);
      }
      return createCluster(list[0].SubnetId, pid, pr);
    });
  }

  function destroy(pid, pr) {

  }

  return {
    create: create,
    destroy: destroy
  };
}

module.exports = getPRManager;

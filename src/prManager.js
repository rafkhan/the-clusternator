'use strict';
var SG = require('./aws/securityGroupManager'),
Ec2 = require('./aws/ec2Manager'),
Cluster = require('./aws/clusterManager'),
Task = require('./aws/taskServicemanager');

function getPRManager(ec2, ecs, vpcId) {
  var securityGroup = SG(ec2, vpcId),
  ec2mgr = Ec2(ec2, vpcId);

  function create(subnetId, pid, pr) {
    return securityGroup.create(pid, pr).//then(function (sDesc) {
      //return nic.create(subnetId, [ sDesc.GroupId ], pid, pr).
      then(function (sDesc) {
        //var nId = nicDesc.NetworkInterface.NetworkInterfaceId;
        return ec2mgr.create({
          clusterName: 'test-pr',
          //nicId: nId,
          pid: pid,
          pr: pr,
          sgId: sDesc.GroupId,
          subnetId: subnetId,
          apiConfig: {
          }
        });
      });
      //- create/tag new security group
      //- create/tag new ec2 image(s)
      //- bind sg to ec2
      //- create new ECS cluster
      //- bind/register ec2(s) to ECS cluster
      //- create new ECS task(s)
      //- create new ECS service(s)
      //- create new Route 53 entry to service
      //- start system
    }

    function destroy(pid, pr) {
      
    }

    return {
      create: create,
      destroy: destroy
    };
  }

  module.exports = getPRManager;

'use strict';

function getPRManager(ec2, ecs) {

  function create(subnetId, pid, pr) {

//- create/tag new security group
//- create/tag new NIC
//- create/tag new ec2 image(s)
//- bind nic to ec2
//- bind sg to ec2
//- create new ECS cluster
//- bind/register ec2(s) to ECS cluster
//- create new ECS task(s)
//- create new ECS service(s)
//- create new Route 53 entry to service
//- start system
  }

  return {
    create: create
  };
}

module.exports = getPRManager;

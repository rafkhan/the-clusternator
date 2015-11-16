'use strict';

var Subnet = require('./aws/subnetManager'),
  Route = require('./aws/routeTableManager'),
  Route53 = require('./aws/route53Manager'),
  Vpc = require('./aws/vpcManager'),
  Acl = require('./aws/aclManager'),
  Pr = require('./prManager'),
  Q = require('q');

function getProjectManager(ec2, ecs, awsRoute53) {
  var vpcId = null,
    pullRequest,
    vpc = Vpc(ec2),
    r53 = Route53(awsRoute53),
    route,
    subnet,
    acl;

  function destroy(pid) {
    return ec2.describe(pid).then((list) => {
      if (list.length) {
        throw new Error('ProjectManager: Cannot destroy project while open ' +
          'pull requests exist');
      }
      return subnet.destroy(pid).then(() => {
          return acl.destroy(pid);
      });
    });
  }

  function create(pid) {
    return Q.all([
      route.findDefault(),
      acl.create(pid)
    ]).then((results) => {
      var routeId = results[0].RouteTableId,
        aclId = results[1].NetworkAcl.NetworkAclId;

      return subnet.create(pid, routeId, aclId);
    });
  }

  function findOrCreateProject(pid) {
    return create(pid).then((sDesc) => {
      return sDesc;
    }, () => {
      return subnet.findProject();
    });
  }

  function createPR(pid, pr) {
    return findOrCreateProject(pid).then((snDesc) => {
      return pullRequest.create(snDesc.Subnet.SubnetId, pid, pr);
    });
  }



  return Q.all([
     vpc.findProject(),
     r53.findId()
  ]).then((results) => {
    var vDesc = results[0],
    zoneId = results[1];

    vpcId = vDesc.VpcId;
    route = Route(ec2, vpcId);
    subnet = Subnet(ec2, vpcId);
    acl = Acl(ec2, vpcId);
    pullRequest = Pr(ec2, ecs, vpcId, zoneId);
    return {
      create,
      createPR,
      destroy
    };
  });


}

module.exports = getProjectManager;

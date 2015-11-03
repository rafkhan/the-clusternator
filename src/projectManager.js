'use strict';

var Subnet = require('./aws/subnetManager'),
Route = require('./aws/routeTableManager'),
Vpc = require('./aws/vpcManager'),
Acl = require('./aws/aclManager'),
Q = require('q');

function getProjectManager(ec2, ecs) {
  var vpcId = null,
  vpc = Vpc(ec2),
  route,
  subnet,
  acl;

  function destroy() {

  }

  function create(pid) {
    return Q.all([
        route.findDefault(),
        acl.create(pid)
    ]).then(function (results) {
        var routeId = results[0].RouteTableId,
        aclId = results[1].NetworkAcl.NetworkAclId;

        return subnet.create(pid, routeId, aclId);
    });
  }

  return vpc.findProject().then(function (vDesc) {
    vpcId = vDesc.VpcId;
    route = Route(ec2, vpcId);
    subnet = Subnet(ec2, vpcId);
    acl = Acl(ec2, vpcId);
    return {
      create: create,
      destroy: destroy,
    };
  });


}

module.exports = getProjectManager;

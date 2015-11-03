'use strict';

var Q = require('q'),
util = require('../util'),
constants = require('../constants');

function getAclManager(ec2, vpcId) {
  var describe = Q.nfbind(ec2.describeNetworkAcls.bind(ec2), {
    DryRun: false,
    Filters: constants.AWS_FILTER_CTAG.concat(util.makeAWSVPCFilter(vpcId))
  });

  function findExistingPid(pid) {
    return describe().then(function (result) {
      result.NetworkAcls.forEach(function (acl) {
        acl.Tags.forEach(function (tag) {
          if (tag.Key === constants.PROJECT_TAG) {
            if (tag.Value === pid) {
              throw new Error('Create ACL Failed: Project: ' + pid +
              ' exists: ' + acl);
            }
          }
        });
      });
    });
  }

    function defaultInOutRules(aclId) {
      var inbound = constants.AWS_DEFAULT_ACL_INGRESS,
      outbound = constants.AWS_DEFAULT_ACL_EGRESS;

      inbound.NetworkAclId = aclId;
      outbound.NetworkAclId = aclId;

      return Q.all([
        Q.nfbind(ec2.createNetworkAclEntry.bind(ec2), inbound)(),
        Q.nfbind(ec2.createNetworkAclEntry.bind(ec2), outbound)()
      ]);
    }

    function createAcl(pid, params) {
      return Q.nfbind(ec2.createNetworkAcl.bind(ec2), params)().
      then(function (result) {
        var aclId = result.NetworkAcl.NetworkAclId;
        return Q.all([
          util.awsTagEc2(ec2, aclId, [
            {
              Key: constants.CLUSTERNATOR_TAG,
              Value: 'true'
            },
            {
              Key: constants.PROJECT_TAG,
              Value: pid
            }
          ]),
          defaultInOutRules(aclId),
        ]).then(function () {
          return result;
        });
      });
    }

    function create(pid) {
      var params = {
        VpcId: vpcId
      };

      return findExistingPid(pid).then(function () {
          return createAcl(pid, params);
      });
    }

    function destroy(aclId, pid) {
      return describe().then(function (list) {
        var acl, isValidPid = false;
        list.NetworkAcls.forEach(function (g){
          if (g.NetworkAclId === aclId) {
            acl = g;
          }
        });

        acl.Tags.forEach(function (tag) {
          if (tag.Key === constants.PROJECT_TAG) {
            if (tag.Value === pid) {
              isValidPid = true;
            }
          }
        });

        if (!isValidPid) {
          throw new Error('No Clusternator Tagged NetworkAcl Available For ' +
          'Destruction With NetworkAclId: ' + aclId + ' ProjectId: ' + pid);
        }

        return Q.nfbind(ec2.deleteNetworkAcl.bind(ec2), {
          NetworkAclId: aclId
        })();
      });
    }

    return {
      describe: describe,
      create: create,
      destroy: destroy
    };
  }


  module.exports = getAclManager;

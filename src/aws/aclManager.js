'use strict';

var Q = require('q'),
  common = require('./common'),
  constants = require('../constants');

function getAclManager(ec2, vpcId) {
  var baseFilters = constants.AWS_FILTER_CTAG.concat(
      common.makeAWSVPCFilter(vpcId)),
    describe = common.makeEc2DescribeFn(
      ec2, 'describeNetworkAcls', 'NetworkAcls', baseFilters);

  function findExistingPid(pid) {
    return describe(pid).then(function(list) {
      if (list.length) {
        throw new Error('Create ACL Failed: Project: ' + pid + ' exists');
      }
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
    then(function(result) {
      var aclId = result.NetworkAcl.NetworkAclId;
      return Q.all([
        common.awsTagEc2(ec2, aclId, [{
          Key: constants.CLUSTERNATOR_TAG,
          Value: 'true'
        }, {
          Key: constants.PROJECT_TAG,
          Value: pid
        }]),
        defaultInOutRules(aclId),
      ]).then(function() {
        return result;
      });
    });
  }

  function create(pid) {
    var params = {
      VpcId: vpcId
    };

    return findExistingPid(pid).then(function() {
      return createAcl(pid, params);
    });
  }

  function destroy(pid) {
    if (!pid) {
      throw new TypeError('Destroy ACL requires a projectId');
    }
    return describe(pid).then(function(list) {
      if (!list.length) {
        common.throwInvalidPidTag(pid, 'looking', 'NetworkAcl');
      }

      return Q.nfbind(ec2.deleteNetworkAcl.bind(ec2), {
        NetworkAclId: list[0].NetworkAclId
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

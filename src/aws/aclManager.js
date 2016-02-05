'use strict';
/**
 * Encapsulates functions needed to CRUD AWS VPC ACLs
 *
 * @module aws/aclManager
 */

const Q = require('q');
const skeletons = require('./ec2Skeletons');
const util = require('../util');
const constants = require('../constants');

var common = require('./common');

/**
  @param {EC2} AWS Ec2 object
  @param {string} vpcId
  @return {AclManager}
*/
function getAclManager(ec2, vpcId) {
  ec2 = util.makePromiseApi(ec2);

  var baseFilters = constants.AWS_FILTER_CTAG.concat(
    common.makeAWSVPCFilter(vpcId));
  var describe = common.makeEc2DescribeFn(
    ec2, 'describeNetworkAcls', 'NetworkAcls', baseFilters);

  /**
    @param {Array}
    @throws {Error}
  */
  function throwIfListHasLength(list) {
    if (list.length) {
      throw new Error('Create ACL Failed: Project: exists');
    }
  }

  /**
    @param {string} aclId
    @return {Q.Promise}
  */
  function defaultInOutRules(aclId) {
    var inbound = skeletons.ACL_DEFAULT_INGRESS,
      outbound = skeletons.ACL_DEFAULT_EGRESS;

    inbound.NetworkAclId = aclId;
    outbound.NetworkAclId = aclId;

    return Q.all([
      ec2.createNetworkAclEntry(inbound),
      ec2.createNetworkAclEntry(outbound)
    ]);
  }


  function createAcl(pid, params) {
    return ec2.createNetworkAcl(params).
    then(function(result) {
      var aclId = result.NetworkAcl.NetworkAclId;
      return Q.all([
        /** @todo UPGRADE to Promise ec2 */
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

  function describeProject(pid) {
    return describe(common.makeProjectFilter(pid));
  }


  function create(pid) {
    if (!pid) {
      throw new TypeError('Create ACL requires a ProjectId');
    }
    var params = util.clone(skeletons.ACL);
    params.VpcId = vpcId;

    return describeProject(pid).
    then((aclList) => {
      if (aclList.length) {
        return {
          NetworkAcl: aclList[0]
        };
      } else {
        return createAcl(pid, params);
      }
    });
  }

  function destroy(pid) {
    if (!pid) {
      throw new TypeError('Destroy ACL requires a projectId');
    }
    return describeProject(pid).then(function(list) {
      if (!list.length) {
        common.throwInvalidPidTag(pid, 'looking', 'NetworkAcl');
      }

      return ec2.deleteNetworkAcl({
        NetworkAclId: list[0].NetworkAclId
      });
    });
  }

  return {
    describe,
    describeProject,
    create,
    destroy,
    helpers: {
      createAcl,
      defaultInOutRules,
      throwIfListHasLength
    }
  };
}


module.exports = getAclManager;

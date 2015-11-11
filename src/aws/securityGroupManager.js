'use strict';

var Q = require('q'),
  common = require('./common'),
  skeletons = require('./ec2Skeletons'),
  util = require('../util'),
  rid = require('../resourceIdentifier'),
  constants = require('../constants');

function getSecurityGroupManager(ec2, vpcId) {
  ec2 = util.makePromiseApi(ec2);
  var baseFilters = constants.AWS_FILTER_CTAG.concat(
      common.makeAWSVPCFilter(vpcId)),
    describe = common.makeEc2DescribeFn(
      ec2, 'describeSecurityGroups', 'SecurityGroups', baseFilters);

  function defaultInOutRules(groupId) {
    var inbound = skeletons.SG_DEFAULT_EGRESS_INGRESS,
      outbound = skeletons.SG_DEFAULT_EGRESS;

    inbound.GroupId = groupId;
    outbound.GroupId = groupId;

    return Q.all([
      ec2.authorizeSecurityGroupIngress(inbound),
      ec2.authorizeSecurityGroupEgress(outbound)
    ]).then(function() {
      return groupId;
    }, function(err) {
      util.plog('SecurityGroup: Warning Could Not Add Custom Rules: ' +
        err.message);
      return groupId;
    });
  }

  function rejectIfExists(pid, pr) {
    return describe(pid, pr).then(function(list) {
      if (list.length) {
        throw new Error('SecurityGroup Exists For Project: ' + pid +
          ' PR: ' + pr);
      }
    });
  }


  function createSecurityGroup(pid, pr) {
    var id = rid.generateRID({
        pid: pid,
        pr: pr
      }),
      params = {
        GroupName: id,
        Description: 'Created by clusternator for ' + pid + ', PR: ' + pr,
        VpcId: vpcId
      };
    return ec2.createSecurityGroup(params).
    then(function(result) {
      return Q.all([
        common.awsTagEc2(ec2, result.GroupId, [{
          Key: constants.CLUSTERNATOR_TAG,
          Value: 'true'
        }, {
          Key: constants.PROJECT_TAG,
          Value: pid
        }, {
          Key: constants.PR_TAG,
          Value: pr
        }]),
        defaultInOutRules(result.GroupId)
      ]).then(function() {
        return result;
      });
    });
  }

  function create(pid, pr) {
    if (!pid || !pr) {
      throw new TypeError('Create SecurityGroup requires a projectId, and ' +
        'pull request #');
    }
    return rejectIfExists(pid, pr).then(function() {
      return createSecurityGroup(pid, pr);
    });
  }

  function destroy(pid, pr) {
    if (!pid || !pr) {
      throw new Error('Destroy SecurityGroups requires a projectId, and a ' +
        'pull request #');
    }

    return describe(pid, pr).then(function(list) {
      if (!list.length) {
        common.throwInvalidPidPrTag(pid, pr, 'looking', 'Group');
      }

      return ec2.deleteSecurityGroup({
        GroupId: list[0].GroupId
      });
    });
  }

  return {
    describe,
    create,
    destroy
  };
}

module.exports = getSecurityGroupManager;

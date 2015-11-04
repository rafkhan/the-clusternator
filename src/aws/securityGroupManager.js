'use strict';

var Q = require('q'),
  common = require('./common'),
  rid = require('../resourceIdentifier'),
  constants = require('../constants');

function getSecurityGroupManager(ec2, vpcId) {
  var baseFilters = constants.AWS_FILTER_CTAG.concat(
      common.makeAWSVPCFilter(vpcId)),
    describe = common.makeEc2DescribeFn(
      ec2, 'describeSecurityGroups', 'SecurityGroups', baseFilters);

  function defaultInOutRules(groupId) {
    var inbound = constants.AWS_DEFAULT_SG_INGRESS,
      outbound = constants.AWS_DEFAULT_SG_EGRESS;

    inbound.GroupId = groupId;
    outbound.GroupId = groupId;

    return Q.all([
      Q.nfbind(ec2.authorizeSecurityGroupIngress.bind(ec2), inbound)(),
      Q.nfbind(ec2.authorizeSecurityGroupEgress.bind(ec2), outbound)()
    ]);
  }

  function rejectIfExists(pid, pr) {
    return describe().then(function(list) {
      list.forEach(function(sgDesc) {
        var isProject = false,
          isPR = false;
        sgDesc.Tags.forEach(function(tag) {
          if ((tag.Key === constants.PROJECT_TAG) && (tag.Value === pid)) {
            isProject = true;
          }
          if ((tag.Key === constants.PR_TAG) && (tag.Value === pr)) {
            isPR = true;
          }
        });
        if (isProject && isPR) {
          throw new Error('SecurityGroup Exists For Project: ' + pid +
            ' PR: ' + pr);
        }
      });
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
    return Q.nfbind(ec2.createSecurityGroup.bind(ec2), params)().
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

      return Q.nfbind(ec2.deleteSecurityGroup.bind(ec2), {
        GroupId: list[0].GroupId
      })();
    });
  }

  return {
    describe: describe,
    create: create,
    destroy: destroy
  };
}

module.exports = getSecurityGroupManager;

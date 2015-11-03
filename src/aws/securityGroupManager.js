'use strict';

var Q = require('q'),
util = require('../util'),
rid = require('../resourceIdentifier'),
constants = require('../constants');

function getSecurityGroupManager(ec2, vpcId) {
  var describe = Q.nfbind(ec2.describeSecurityGroups.bind(ec2), {
    DryRun: false,
    Filters: constants.AWS_FILTER_CTAG.concat(util.makeAWSVPCFilter(vpcId))
  });

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
    return describe().then(function (list) {
      list.SecurityGroups.forEach(function (sgDesc) {
        var isProject = false, isPR = false;
        sgDesc.Tags.forEach(function (tag) {
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
    var id = rid.generateRID({ pid: pid, pr: pr }),
    params = {
      GroupName: id,
      Description: 'Created by clusternator for ' + pid + ', PR: ' + pr,
      VpcId: vpcId
    };
    return Q.nfbind(ec2.createSecurityGroup.bind(ec2), params)().
    then(function (result) {
      return Q.all([
        util.awsTagEc2(ec2, result.GroupId, [
          {
            Key: constants.CLUSTERNATOR_TAG,
            Value: 'true'
          },
          {
            Key: constants.PROJECT_TAG,
            Value: pid
          },
          {
            Key: constants.PR_TAG,
            Value: pr
          }
        ]),
        defaultInOutRules(result.GroupId)
      ]).then(function () {
        return result;
      });
    });
  }

  function create(pid, pr) {

    return rejectIfExists(pid, pr).then(function () {
      return createSecurityGroup(pid, pr);
    });
  }

  function destroy(groupId, pid, pr) {
    return describe().then(function (list) {
      var sg, isValidPid = false, isValidPr = false;
      list.SecurityGroups.forEach(function (g){
        if (g.GroupId === groupId) {
          sg = g;
        }
      });

      sg.Tags.forEach(function (tag) {
        if (tag.Key === constants.PROJECT_TAG) {
          if (tag.Value === pid) {
            isValidPid = true;
          }
        }
        if (tag.Key === constants.PR_TAG) {
          if (tag.Value === pr) {
            isValidPr = true;
          }
        }
      });

      if (!(isValidPid && isValidPr)) {
        throw new Error('No Clusternator Tagged SecurityGroup Available For ' +
        'Destruction With GroupId: ' + groupId + ' ProjectId: ' + pid +
        ' and PR: ' + pr);
      }

      return Q.nfbind(ec2.deleteSecurityGroup.bind(ec2), {
        GroupId: groupId
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

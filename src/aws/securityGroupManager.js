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
      ec2, 'describeSecurityGroups', 'SecurityGroups', baseFilters),
    describeProject = common.makeEc2DescribeProjectFn(describe),
    describePr = common.makeEc2DescribePrFn(describe),
    describeDeployment = common.makeEc2DescribeDeployment(describe);

  function defaultInOutRules(groupId) {
    var inbound = skeletons.SG_DEFAULT_INGRESS,
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
    return describePr(pid, pr).then(function(list) {
      if (list.length) {
        throw new Error('SecurityGroup Exists For Project: ' + pid +
          ' PR: ' + pr);
      }
    });
  }


  /**
   * @param {string} pid
   * @param {string} pr
   * @returns {Q.Promise}
   */
  function createSecurityGroupPr(pid, pr) {
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
        console.log('result', result);
        return result;
      });
    });
  }

  /**
   * @param {string} pid
   * @param {string} deployment
   * @param {string} sha
   * @returns {Q.Promise}
   */
  function createSecurityGroupDeployment(pid, deployment, sha) {
    var id = rid.generateRID({
        pid: pid,
        sha: sha
      }),
      params = {
        GroupName: id,
        Description: 'Created by clusternator for ' + pid + ', Deplyoment: ' +
        deployment,
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
          Key: constants.DEPLOYMENT_TAG,
          Value: deployment
        },{
          Key: constants.SHA_TAG,
          Value: sha
        }]),
        defaultInOutRules(result.GroupId)
      ]).then(function() {
        console.log('result', result);
        return result;
      });
    });
  }

  /**
   * @param {string} pid
   * @param {string} deployment
   * @param {string} sha
   * @returns {Q.Promise}
   */
  function createDeployment(pid, deployment, sha) {
    if (!pid || !deployment || !sha) {
      throw new TypeError('Create SecurityGroup requires a projectId, a ' +
        'deployment label, and a SHA');
    }
    return describeDeployment(pid, deployment).then(function(list) {
      if (list.length) {
        // return the id
        console.log('PANIC security group createDeployment not implemented');
      } else {
        // make a new one
        return createSecurityGroupDeployment(pid, deployment, sha);
      }
    });
  }

  /**
   * @param {string} pid
   * @param {string} pr
   * @returns {Q.Promise}
   */
  function createPr(pid, pr) {
    if (!pid || !pr) {
      throw new TypeError('Create SecurityGroup requires a projectId, and ' +
        'pull request #');
    }
    return rejectIfExists(pid, pr).then(function() {
      return createSecurityGroupPr(pid, pr);
    });
  }

  /**
   * @param {string} pid
   * @param {string} pr
   * @returns {Q.Promise}
   */
  function destroyPr(pid, pr) {
    if (!pid || !pr) {
      throw new Error('Destroy SecurityGroups requires a projectId, and a ' +
        'pull request #');
    }

    return describePr(pid, pr).then(function(list) {
      if (!list.length) {
        common.throwInvalidPidPrTag(pid, pr, 'looking', 'Group');
      }

      return ec2.deleteSecurityGroup({
        GroupId: list[0].GroupId
      });
    });
  }

  /**
   * @param {string} pid
   * @param {string} deployment
   * @returns {Q.Promise}
   */
  function destroyDeployment(pid, deployment) {
    if (!pid || !deployment) {
      throw new Error('Destroy SecurityGroups requires a projectId, and a ' +
        'deployment label');
    }

    return describeDeployment(pid, deployment).then(function(list) {
      if (!list.length) {
        common.throwInvalidPidPrTag(pid, deployment, 'looking', 'Group');
      }

      return ec2.deleteSecurityGroup({
        GroupId: list[0].GroupId
      });
    });
  }

  return {
    describe,
    describeProject,
    describePr,
    describeDeployment,
    createPr,
    createDeployment,
    destroyPr,
    destroyDeployment,
    helpers: {
      defaultInOutRules
    }
  };
}

module.exports = getSecurityGroupManager;

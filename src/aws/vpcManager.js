'use strict';
/**
 * Simplifies dealing with AWS's VPC's
 *
 * @module aws/vpcManager
 */

const util = require('../util');
const constants = require('../constants');
const awsConstants = require('./aws-constants');

function getVpcManager(ec2) {
  ec2 = util.makePromiseApi(ec2);

  function describe() {
    return ec2.describeVpcs({
      DryRun: false,
      Filters: awsConstants.AWS_FILTER_CTAG
    });
  }

  /**
    finds a vpc from a project
    @param {string} projectId
    @param {Object} list (see AWS docs)
    http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html
  */
  function findProjectTag(projectId, list) {
    let vpc = null;
    list.Vpcs.forEach(function(vDesc) {
      vDesc.Tags.forEach(function(tag) {
        if (tag.Key !== constants.PROJECT_TAG) {
          return;
        }
        if (tag.Value === projectId) {
          vpc = vDesc;
        }
      });
    });
    return vpc;
  }


  /**
    finds the _last_ clusternator tagged VPC _without_ a clusternator proj tag
    @param {Object} list (see AWS docs)
    http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html
  */
  function findMasterVPC(list) {
    let vpc = null;
    list.Vpcs.forEach(function(vDesc) {
      let foundTag = false;
      vDesc.Tags.forEach(function(tag) {
        if (tag.Key === constants.PROJECT_TAG) {
          foundTag = true;
        }
      });
      if (!foundTag) {
        vpc = vDesc;
      }
    });
    return vpc;
  }

  function findProjectVPC(projectId) {
    return describe().then(function(list) {
      let vpc = findProjectTag(projectId, list);
      if (vpc) {
        return vpc;
      }
      vpc = findMasterVPC(list);
      if (vpc) {
        return vpc;
      }
      throw new Error('No Clusternator VPCs found');
    });
  }

  return {
    describe,
    findProject: findProjectVPC,
    helpers: {
      findProjectTag,
      findProjectVPC,
      findMasterVPC,
    }
  };
}


module.exports = getVpcManager;

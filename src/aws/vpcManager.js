'use strict';

var Q = require('q'),
constants = require('../constants');

function getVpcManager(ec2) {
  var describeClusterVPCs = Q.nfbind(ec2.describeVpcs.bind(ec2), {
    DryRun: false,
    Filters: constants.AWS_FILTER_CTAG
  });

  /**
    finds a vpc from a project
    @param {string} projectId
    @param {Object} list (see AWS docs)
    http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeVpcs-property
  */
  function findProjectTag(projectId, list) {
      var vpc = null;
      list.Vpcs.forEach(function (vDesc) {
        vDesc.Tags.forEach(function (tag) {
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
    http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeVpcs-property
  */
  function findMasterVPC(list) {
      var vpc = null;
      list.Vpcs.forEach(function (vDesc) {
        var foundTag = false;
        vDesc.Tags.forEach(function (tag) {
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
    return describeClusterVPCs().then(function (list) {
      var vpc = findProjectTag(projectId, list);
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
    describe: describeClusterVPCs,
    findProject: findProjectVPC,
    findProjectTag: findProjectTag,
    findProjectVPC: findProjectVPC,
    findMasterVPC: findMasterVPC
  };
}


module.exports = getVpcManager;

'use strict';
var constants = require('../constants'),
  Q = require('q');

function throwInvalidPidPrTag(pid, pr, id, label) {
  throw new Error('No Clusternator Tagged ' + label + ' Available For ' +
    'Destruction With ' + label + ' For Project: ' + pid + ' Id: ' + id +
    ' PR: ' + pr);
}

function throwInvalidPidTag(pid, id, label) {
  throw new Error('No Clusternator Tagged ' + label + ' Available For ' +
    'Destruction With ' + label + ' For Project: ' + pid + ' Id: ' + id);
}

/**
@param {string} pid
@param {Tag[]} collection
*/
function areTagsPidValid(pid, collection) {
  var isValid = false;
  collection.forEach(function(tag) {
    if (tag.Key !== constants.PROJECT_TAG) {
      return;
    }
    if (tag.Value === pid) {
      isValid = true;
    }
  });
  return isValid;
}

/**
@param {string} pid project identifier
@param {string} pr pull request #
@param {Tags[]} collection to search
@return {boolean}
*/
function areTagsPidPrValid(pid, pr, collection) {
  var isValidPid = false,
    isValidPr = false;

  collection.forEach(function(tag) {
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

  return isValidPid && isValidPr;
}

/**
@param {string} key
@param {*} value
@return {AWSFilter}
*/
function makeAWSFilter(key, value) {
  if (!Array.isArray(value)) {
    value = [value];
  }
  return [{
    Name: key,
    Values: value
  }];
}

/**
@param {string} value
@return {AWSFilter}
*/
function makeAWSVPCFilter(value) {
  return makeAWSFilter('vpc-id', value);
}

/**
@param {string} key
@param {*} value
@return {AWSFilter}
*/
function makeAWSTagFilter(key, value) {
  return makeAWSFilter('tag:' + key, value);
}

/**
@param {EC2} ec2
@param {string[]|string} resourceIds
@param {Tags[]} tags
*/
function awsTagEc2(ec2, resourceIds, tags) {
  if (!Array.isArray(resourceIds)) {
    resourceIds = [resourceIds];
  }
  return ec2.createTags({
    Resources: resourceIds,
    Tags: tags
  });
}

/**
@param {EC2} ec2
@param {string} apiFn name of the ec2 api function to call
@param {string} apiListName name of the description list in the result
@param {Filter[]} baseFilters
@return function(...)
*/
function makeEc2DescribeFn(ec2, apiFn, apiListName, baseFilters) {
  /**
  @param {string=} pid projectId
  @param {string=} pr pull request
  @return {Q.Promise}
  */
  function describe(pid, pr) {
    var filters = [];
    if (pid) {
      filters = filters.concat(
        makeAWSTagFilter(constants.PROJECT_TAG, pid));
    }
    if (pr) {
      filters = filters.concat(
        makeAWSTagFilter(constants.PR_TAG, pr));
    }
    return ec2[apiFn]({
      DryRun: false,
      Filters: baseFilters.concat(filters)
    }).then(function(result) {
      // this case happens when describing ec2 insances
      if (!result[apiListName]) {
        return [];
      }
      // normal case
      return result[apiListName];
    });

  }
  return describe;
}

module.exports = {
  areTagsPidPrValid: areTagsPidPrValid,
  areTagsPidValid: areTagsPidValid,
  throwInvalidPidTag: throwInvalidPidTag,
  throwInvalidPidPrTag: throwInvalidPidPrTag,
  awsTagEc2: awsTagEc2,
  makeAWSVPCFilter: makeAWSVPCFilter,
  makeAWSTagFilter: makeAWSTagFilter,
  makeAWSFilter: makeAWSFilter,
  makeEc2DescribeFn: makeEc2DescribeFn
};

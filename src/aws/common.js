'use strict';
/**
 * Functions common to all aws/* modules
 *
 * @module aws/common
 */
const constants = require('../constants');
const rid = require('../resource-identifier');
const Q = require('q');

/**
 * @param {string} pid
 * @param {string} pr
 * @param {string} id
 * @param {string} label
 * @throws {Error}
 */
function throwInvalidPidPrTag(pid, pr, id, label) {
  throw new Error('No Clusternator Tagged ' + label + ' Available For ' +
    'Destruction With ' + label + ' For Project: ' + pid + ' Id: ' + id +
    ' PR: ' + pr);
}

/**
 * @param {string} pid
 * @param {string} deployment
 * @param {string} id
 * @param {string} label
 * @throws {Error}
 */
function throwInvalidPidDeploymentTag(pid, deployment, id, label) {
  throw new Error('No Clusternator Tagged ' + label + ' Available For ' +
    'Destruction With ' + label + ' For Project: ' + pid + ' Id: ' + id +
    ' Deployment: ' + deployment);
}

/**
 * @param {string} pid
 * @param {string} id
 * @param {string} label
 * @throws {Error}
 */
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
  collection.forEach((tag) => {
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
  let isValidPid = false;
  let isValidPr = false;

  collection.forEach((tag) => {
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
  @param {AwsFilter[]|AwsFilter} filters
  @return {Q.Promise}
  */
  function describe(filters) {
    if (!Array.isArray(filters)) {
      if (filters) {
        filters = [filters];
      } else {
        filters = [];
      }
    }
    return ec2[apiFn]({
      DryRun: false,
      Filters: baseFilters.concat(filters)
    }).then((result) => {
      // this case happens when describing ec2 instances
      if (!result[apiListName]) {
        return [];
      }
      // normal case
      return result[apiListName];
    });

  }
  return describe;
}

/**
 * @param {function(...):Q.Promise} describe
 * @returns {function(...):Q.Promise}
 */
function makeEc2DescribeProjectFn(describe) {
  /**
   * @param {string} pid
   * @returns {Q.Promise}
   */
  function describeProject(pid) {
    return describe(makeProjectFilter(pid));
  }
  return describeProject;
}

/**
 * @param {function(...):Q.Promise} describe
 * @returns {function(...):Q.Promise}
 */
function makeEc2DescribePrFn(describe) {
  /**
   * @param {string} pid
   * @param {string} pr
   * @returns {Q.Promise}
   */
  function describePr(pid, pr) {
    return describe(
      makeProjectFilter(pid).concat(makePrFilter(pr))
    );
  }
  return describePr;
}

/**
 * @param {function(...):Q.Promise} describe
 * @returns {function(...):Q.Promise}
 */
function makeEc2DescribeDeployment(describe) {
  /**
   * @param {string} pid
   * @param {string} deployment
   * @returns {Q.Promise}
   */
  function describeDeployment(pid, deployment) {
    return describe(
      makeProjectFilter(pid).concat( makeDeploymentFilter(deployment))
    );
  }
  return describeDeployment;
}

/**
 * @param {string} pid
 * @returns {AWSFilter}
 */
function makeProjectFilter(pid) {
  return makeAWSTagFilter(constants.PROJECT_TAG, pid);
}

/**
 * @param {string} deployment
 * @returns {AWSFilter}
 */
function makeDeploymentFilter(deployment) {
  return makeAWSTagFilter(constants.DEPLOYMENT_TAG, deployment);
}

/**
 * @param {string} pr
 * @returns {AWSFilter}
 */
function makePrFilter(pr) {
  pr = pr + '';
  return makeAWSTagFilter(constants.PR_TAG, pr);
}

/**
 * @param {string} attr
 * @param {AWSEc2DescribeResults} results
 * @returns {string}
 * @throws {TypeError}
 */
function findFromEc2Describe(attr, results) {
  /** @todo in the future this might be plural? */
  if (!results[0]) {
    throw new Error('createPR: unexpected EC2 create results');
  }
  var result = '';
  results[0].Instances.forEach((inst) => {
    result = inst[attr];
  });
  return result;
}


/**
 * @param {AWSEc2DescribeResults} results
 * @returns {string}
 */
function findIdFromEc2Describe(results) {
  return findFromEc2Describe('InstanceId', results);
}

/**
 * @param {AWSEc2DescribeResults} results
 * @returns {string}
 * @throws {Error}
 */
function findIpFromEc2Describe(results) {
  const ip = findFromEc2Describe('PublicIpAddress', results);
  if (!ip) {
    throw new Error('createPR: expecting a public IP address');
  }
  return ip;
}


/**
 * @param {AWSPromiseWrappedCluster} cluster
 * @param {string} clusterName
 * @returns {function(...):Q.Promise}
 */
function getDeregisterClusterFn(cluster, clusterName) {
  return (arn) => {
    return cluster.deregister(
      arn, clusterName
    ).fail((err) => {
      //util.info('Deployment: destroy EC2: Warning, Deregistration for ' +
      //  'instance ' + arn + ' failed, project: ' + pid + ' deployment ' +
      //  deployment + ' error: ' + err.message);
      // do nothing on failure, deregistration _should_ actually work
      // automagically
    });
  };
}


/**
 * @param {string} arn
 * @returns {*}
 */
function filterValidArns(arn) {
  const splits = arn.split('/');
  const name = splits[splits.length - 1];
  return rid.isRID(name);
}

/**
 * @param {string} arn
 * @returns {*}
 * @private
 */
function getArnParts_(arn) {
  var arnParts = arn
    .split('/')
    .filter((i) => i);

  return rid.parseRID(arnParts[arnParts.length - 1]);
}

/**
 * @param {string} projectId
 * @returns {function(...):boolean}
 */
function getProjectIdFilter(projectId) {
  return (arn) => {
    var parts = getArnParts_(arn);
    if (parts.pid === projectId) {
      return true;
    }
    return false;
  };
}

/**
 * @param {string} projectId
 * @param {string} pr
 * @returns {function(...):boolean}
 */
function getPrFilter(projectId, pr) {
  return (arn) => {
    var parts = getArnParts_(arn);
    if (parts.pid === projectId && parts.pr === pr) {
      return true;
    }
    return false;
  };
}

/**
 * @param {Object} subnet
 * @param {Object} creq
 * @returns {Q.Promise<{{ subnetId: string }}>}
 */
function setSubnet(subnet, creq) {
  return subnet
    .describeProject(creq.projectId)
    .then((list) => {
      if (!list.length) {
        throw new Error('Create Deployment failed, no subnet found for ' +
          `Project: ${creq.projectId}`);
      }
      creq.subnetId = list[0].SubnetId;
      return creq;
    });
}

/**
 * @param {string} projectId
 * @param {string} deploymnet
 * @returns {function(...):boolean}
 */
function getDeploymentFilter(projectId, deployment) {
  return (arn) => {
    var parts = getArnParts_(arn);
    if (parts.pid === projectId && parts.deployment === deployment) {
      return true;
    }
    return false;
  };
}

/**
 * @param {function(...):Q.Promise} createElb
 * @param {function(...):Q.Promise} createEc2
 * @param {Object} creq
 * @returns {Q.Promise<{{ dns: string, elbId: string, ec2Info: Object }}>}
 */
function createElbEc2(createElb, createEc2, creq) {
  return Q
    .all([
      createEc2(creq),
      createElb(creq)
    ])
    .then((results) => {
      creq.dns = results[1].dns;
      creq.elbId = results[1].id;
      creq.ec2Info = results[0];
      return creq;
    });
}

/**
 * @param {Objecet} task
 * @param {Object} creq
 * @returns {Q.Promise<Object>}
 */
function createTask(task, creq) {
  return task
    .create(creq.name, creq.name, creq.appDef)
    .then(() => creq);
}


/**
 * @param {Object} elb
 * @param {Object} creq
 * @returns {Q.Promise<Object>}
 */
function registerEc2ToElb(elb, creq) {
  return elb.registerInstances(creq.elbId,
    [findIdFromEc2Describe(creq.ec2Info)])
    .then(() => creq);
}

/**
 * @param {{ tld: string }} config
 * @param {string} url
 * @returns {string}
 */
function qualifyUrl(config, url) {
  var tld = config.tld || '.example.com';
  if (tld[0] !== '.') {
    tld = `.${tld}`;
  }
  return url + tld;
}

module.exports = {
  areTagsPidPrValid,
  areTagsPidValid,
  throwInvalidPidTag,
  throwInvalidPidPrTag,
  throwInvalidPidDeploymentTag,
  awsTagEc2,
  makeProjectFilter,
  makePrFilter,
  makeAWSVPCFilter,
  makeAWSTagFilter,
  makeAWSFilter,
  makeEc2DescribeFn,
  makeEc2DescribeProjectFn,
  makeEc2DescribePrFn,
  makeEc2DescribeDeployment,
  findIdFromEc2Describe,
  findIpFromEc2Describe,
  getDeregisterClusterFn,
  filterValidArns,
  getProjectIdFilter,
  getPrFilter,
  getDeploymentFilter,
  setSubnet,
  createElbEc2,
  createTask,
  registerEc2ToElb,
  qualifyUrl
};

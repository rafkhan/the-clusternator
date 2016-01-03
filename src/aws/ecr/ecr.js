'use strict';

const common = require('../common');

module.exports = {
  create,
  destroy,
  describe,
  list
};


/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise}
 */
function create(aws, name) {
  name = common.clusternatePrefixString(name);
  return aws.ecr.createRepository({
    repositoryName: name
  });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise}
 */
function destroy(aws, name) {
  name = common.clusternatePrefixString(name);
  return aws.ecr.deleteRepositroy({
    repositoryName: name
  });
}

/**
 * @param {AwsWrapper} aws
 * @returns {Q.Promise}
 */
function describe(aws) {
  return aws.ecr.describeRepositories();
}

function list() {

}
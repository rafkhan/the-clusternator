'use strict';

const common = require('../common');
const util = require('../../util');
const rid = require('../../resourceIdentifier');

module.exports = {
  create,
  destroy,
  describe,
  list,
  arn
};


/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise}
 * @throws {TypeError}
 */
function create(aws, name) {
  if (!name) {
    throw new TypeError('ECR: create requires a name');
  }
  name = rid.clusternatePrefixString(name);
  return aws.ecr
    .createRepository({
      repositoryName: name })
    .fail(() => describeName(aws, name)
      .fail((err) => {
        util.warn(`ECR: create ${name}: unexpected error: ${err.message}`);
        throw err;
      }));
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise}
 * @throws {TypeError}
 */
function destroy(aws, name) {
  if (!name) {
    throw new TypeError('ECR: destroy requires a name');
  }
  name = rid.clusternatePrefixString(name);
  return aws.ecr
    .deleteRepository({
      repositoryName: name })
    .fail(() => describeName(aws, name)
      // if there's no name it was already deleted, this is fine
      .fail(() => null));
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise<Object>}
 * @throws {TypeError}
 */
function describeName(aws, name) {
  if (!name) {
    throw new TypeError('ECR: describing named repositories requires a name');
  }
  return describe(aws, name)
    .then((desc) => desc[0] || null);

}

/**
 * @param {AwsWrapper} aws
 * @param {string=} name
 * @returns {Q.Promise<Object[]>}
 */
function describe(aws, name) {
  const params = {};
  if (name) {
    params.repositoryNames = [name];
  }
  return aws.ecr
    .describeRepositories(params)
    .then((desc) => desc.repositories);
}

/**
 * @param {Object} desc
 * @returns {string}
 */
function mapDescToName(desc) {
  return desc.repositoryName;
}

/**
 * @param {Object} desc
 * @returns {string}
 */
function mapDescToArn(desc) {
  return desc.repositoryArn;
}

/**
 * @param {AwsWrapper} aws
 * @returns {Q.Promise.<string[]>}
 */
function list(aws) {
  return describe(aws)
    .then((desc) => desc.map(mapDescToName));
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise<string>}
 * @throws {TypeError}
 */
function arn(aws, name) {
  if (!name) {
    throw new TypeError('ECR: looking up arns requires a name');
  }
  return describe(aws, name)
  .then((desc) => desc.map(mapDescToArn)[0] || '');
}
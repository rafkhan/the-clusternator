'use strict';
/**
 * Tagging functions for AWS EC2
 *
 * @module aws/ec2/tag
 */

const constants = require('../../constants');

module.exports = {
  create: Ec2Tag,
  createClusternator,
  createProject,
  createDeployment,
  createPr,
  Ec2Tag,
  tag
};

/**
 * @param {AwsWrapper} aws
 * @param {string[]} resources
 * @param {Ec2Tag[]} tags
 * @returns {Promise}
 * @throws {TypeError}
 */
function tag(aws, resources, tags) {
  if (!Array.isArray(resources)) {
    throw new TypeError('tag expects a resources array');
  }
  if (!Array.isArray(tags)) {
    throw new TypeError('tag expects a tags array');
  }
  return aws.ec2.createTags({
    Resources: resources,
    Tags: tags
  });
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {Ec2Tag}
 * @throws {TypeError}
 */
function Ec2Tag (key, value) {
  if (!key || !value) {
    throw new TypeError('tags require a key and value');
  }
  if (this  instanceof Ec2Tag) {
    this.Key = key + '';
    this.Value = value + '';
    return this;
  }
  return new Ec2Tag(key, value);
}

/**
 * @returns {Ec2Tag}
 */
function createClusternator() {
  return Ec2Tag(constants.CLUSTERNATOR_TAG, 'true');
}

/**
 * @param {string} projectId
 * @returns {Ec2Tag}
 */
function createProject(projectId) {
  return Ec2Tag(constants.PROJECT_TAG, projectId);
}

/**
 * @param {string} prNum
 * @returns {Ec2Tag}
 */
function createPr(prNum) {
  return Ec2Tag(constants.PR_TAG, prNum);
}

/**
 * @param {string} deployment
 * @returns {Ec2Tag}
 */
function createDeployment(deployment) {
  return Ec2Tag(constants.DEPLOYMENT_TAG, deployment);
}

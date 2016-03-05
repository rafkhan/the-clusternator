'use strict';
/**
 * Tagging functions for AWS EC2
 *
 * @module aws/ec2/tag
 */

module.exports = {
  create: Ec2Tag,
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

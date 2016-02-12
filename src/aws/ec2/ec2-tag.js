'use strict';
/**
 * Tagging functions for AWS EC2
 *
 * @module aws/ec2/tag
 */

module.exports = {
  create: Ec2Tag,
  tag
};

/**
 * @param {AwsWrapper} aws
 * @param {string[]} resources
 * @param {Ec2Tag[]} tags
 */
function tag(aws, resources, tags) {
  return aws.ec2.createTags({
    Resources: resources,
    Tags: tags
  });
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {Ec2Tag}
 */
function Ec2Tag (key, value) {
  if (this  instanceof Ec2Tag) {
    this.Key = key + '';
    this.Value = value + '';
    return this;
  }
  return new Ec2Tag(key, value);
}

'use strict';
/**
 * Filter functions for AWS EC2
 *
 * @module aws/ec2/filter
 */

const constants = require('../../constants');

module.exports = {
  create: Filter,
  createVpc,
  createTag,
  createTagKey,
  createClusternator
};

/**
 * @param {string} name
 * @param {string|string[]} values
 * @constructor
 */
function Filter(name, values) {
  if (!(this instanceof Filter)) {
    return new Filter(name, values);
  }
  this.Name = name;
  this.Values = Array.isArray(values) ? values : [values];
}

/**
 * @param {string|string[]} values
 * @returns {Filter}
 */
function createVpc(values) {
  return new Filter('vpc-id', values);
}


/**
 * @param {string} tagName
 * @param {string|string[]} values
 * @returns {Filter}
 */
function createTag(tagName, values) {
  return new Filter('tag:' + tagName, values);
}

/**
 * @param {string|string[]} values
 * @returns {Filter}
 */
function createTagKey(values) {
  return new Filter('tag-key', values);
}

/**
 * @returns {Filter}
 */
function createClusternator() {
  return createTagKey(constants.CLUSTERNATOR_TAG);
}

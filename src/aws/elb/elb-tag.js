'use strict';
/**
 * Tagging functions for AWS ELB
 *
 * @module aws/elb/tag
 */

module.exports = {
  create: ElbTag
};

/**
 * @todo this is identical to the ec2 tag lets generalize these at some point
 * 
 * @param {string} key
 * @param {string} value
 * @constructor
 */
function ElbTag(key, value) {
  if (!(this instanceof ElbTag)) {
    return new ElbTag(key, value);
  }
  this.Key = key;
  this.Value = value + '';
}

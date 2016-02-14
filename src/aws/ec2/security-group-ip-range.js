'use strict';
/**
 * Types for managing AWS EC2 SecurityGroup IP Ranges
 *
 * @module aws/ec2/sg/ipRange
 */

module.exports = {
  create
};

/**
 * @param {string} cidrIp
 * @constructor
 */
function SgIpRange(cidrIp) {
  if (!(this instanceof SgIpRange)) {
    return new SgIpRange(cidrIp);
  }
  this.CidrIp = cidrIp;
}

/**
 * @param {string} cidrIp
 * @returns {SgIpRange}
 */
function create(cidrIp) {
  return new SgIpRange(cidrIp);
}

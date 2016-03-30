'use strict';
/**
 * Types for managing AWS EC2 SecurityGroup IP Ranges
 *
 * @module aws/ec2/sg/ipRange
 */

module.exports = {
  create: SgIpRange,
  SgIpRange
};

/**
 * @param {string} cidrIp
 * @constructor
 * @throws {TypeError}
 */
function SgIpRange(cidrIp) {
  if (!cidrIp) {
    throw new TypeError('SgIpRange requires a cidrIp');
  }
  if (!(this instanceof SgIpRange)) {
    return new SgIpRange(cidrIp);
  }
  this.CidrIp = cidrIp;
}

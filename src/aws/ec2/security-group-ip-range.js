'use strict';
/**
 * Types for managing AWS EC2 SecurityGroup IP Ranges
 *
 * @module aws/ec2/sg/ipRange
 */

module.exports = {
  create
};

class SgIpRange {
  /**
   * @param {string} cidrIp
   */
  constructor(cidrIp){
    this.CidrIp = cidrIp;
  }
}

/**
 * @param {string} cidrIp
 * @returns {SgIpRange}
 */
function create(cidrIp) {
  return new SgIpRange(cidrIp);
}

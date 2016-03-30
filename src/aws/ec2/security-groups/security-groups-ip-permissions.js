'use strict';
/**
 * Types for managing AWS EC2 SecurityGroups IP Permissions
 *
 * @module aws/ec2/sg/ipPermissions
 */

module.exports = {
  create: SgIpPermissions,
  SgIpPermissions
};

const validProtocols = Object.freeze(['-1', 'tcp', 'udp', 'icmp']);

/**
 * @param {string} protocol
 * @param {number} fromPort
 * @param {number} toPort
 * @param {SgIpRange[]|SgUserIdGroupPair[]} ipRangesOrSgs
 * @constructor
 */
function SgIpPermissions(protocol, fromPort, toPort, ipRangesOrSgs) {
  if (!(this instanceof SgIpPermissions)) {
    return new SgIpPermissions(protocol, fromPort, toPort, ipRangesOrSgs);
  }
  this.IpProtocol = SgIpPermissions.validateProtocol(protocol);
  this.FromPort = SgIpPermissions.validatePort(fromPort);
  this.ToPort = SgIpPermissions.validatePort(toPort);
  if (SgIpPermissions.validateIpRangeOrSgs(ipRangesOrSgs) === 'ip') {
    this.IpRanges = ipRangesOrSgs;
  } else {
    this.UserIdGroupPairs = ipRangesOrSgs;
  }
}

/**
 * @param {string|number} protocol
 * @returns {boolean}
 * @throws {TypeError}
 */
SgIpPermissions.validateProtocol = function validateProtocol(protocol) {
  const index = validProtocols.indexOf(protocol + '');
  if (index === -1) {
    throw new TypeError('invalid protocol: ' + protocol);
  }
  return validProtocols[index];
};

/**
 * @param {number} port
 * @returns {number}
 * @throws {TypeError}
 */
SgIpPermissions.validatePort = function validatePort(port) {
  port = +port;
  if (port < 1) {
    throw new TypeError('invalid port number: ' + port);
  }
  if (port >= 65535) {
    throw new TypeError('invalid port number: ' + port);
  }
  return port;
};

/**
 * @param {SgIpRange|SgUserIdGroupPair} ipRangeOrSg
 * @returns {string}
 * @throws {TypeError}
 */
SgIpPermissions.detectIpRangeOrSg = function(ipRangeOrSg) {
  let type = '';
  if (ipRangeOrSg.CidrIp) {
    type = 'ip';
  }
  if (ipRangeOrSg.GroupId) {
    type = 'sg';
  }
  if (!type) {
    throw new TypeError('SgIpPermission expecting ip range, or security ' +
      'group');
  }
  return type;
};

/**
 * @param {string} prev
 * @param {SgIpRange|SgUserIdGroupPair} current
 * @returns {string}
 * @throws {TypeError}
 */
SgIpPermissions.reduceIpRangeOrSgs =
  function reduceIpRangeOrSgs(prev, current) {
    const cType = SgIpPermissions.detectIpRangeOrSg(current);
    if (!prev) {
      return cType;
    }
    if (cType === prev) {
      return cType;
    }
    throw new TypeError('SgIpPermissions must be entirely ip ranges, or ' +
      'security groups');
  };

/**
 * @param {SgIpRange[]|SgUserIdGroupPair[]} ipRangesOrSgs
 * @returns {string}
 * @throws {TypeError}
 */
SgIpPermissions.validateIpRangeOrSgs = function(ipRangesOrSgs) {
  if (!Array.isArray(ipRangesOrSgs)) {
    throw new TypeError('SgIpPermissions expecting array of ip ranges, or ' +
      'security groups');
  }
  return ipRangesOrSgs.reduce(SgIpPermissions.reduceIpRangeOrSgs, null);
};


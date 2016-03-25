'use strict';
/**
 * @module aws/ec2/network-interface
 * 
 * This is a *minimal* NIC required to runInstances
 * http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html
 */

module.exports = {
  create: NetworkInterface,
  NetworkInterface
};

/**
 * @param {string} securityGroupId
 * @param {string} subnetId
 * @returns {NetworkInterface}
 * @constructor
 * @throws {TypeError}
 */
function NetworkInterface(securityGroupId, subnetId) {
  if (!(this instanceof NetworkInterface)) {
    return new NetworkInterface(securityGroupId, subnetId);
  } 
  if (!securityGroupId || !subnetId) {
    throw new TypeError('Network Interface requires a securityGroupId and ' +
      'subnetId');
  }

  this.DeviceIndex = 0;
  this.AssociatePublicIpAddress = true;
  this.SubnetId = subnetId;
  this.DeleteOnTermination = true;
  this.Groups = [securityGroupId];
}
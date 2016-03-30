'use strict';
/**
 * @module aws/ec2/ec2-vm-params
 *
 * This is a *minimal* params required to runInstances
 * http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html
 */

const awsConstants = require('../../aws-constants');
const nic = require('./../network-interface');

module.exports = {
  create: VmParams,
  VmParams
};

/**
 * @param {NetworkInterface} networkInterface
 * @returns {VmParams}
 * @constructor
 * @throws {TypeError}
 */
function VmParams(networkInterface) {
  if (!(this instanceof VmParams)) {
    return new VmParams(networkInterface);
  }
  
  if (!(networkInterface instanceof nic.NetworkInterface)) {
    throw new TypeError('VmParams require a NetworkInterface'); 
  }

  this.ImageId = awsConstants.AWS_DEFAULT_EC2_AMI;
  this.MaxCount = 1;
  this.MinCount = 1;

  this.DisableApiTermination = false;

  this.IamInstanceProfile = {
    Name: 'ecsInstanceRole'
  };

  this.EbsOptimized = false;

  this.InstanceInitiatedShutdownBehavior = 'terminate';

  this.InstanceType = awsConstants.AWS_DEFAULT_EC2_TYPE;

  this.Monitoring = {
    // @todo investigate cloud watch
    Enabled: true /* required */
  };

  this.NetworkInterfaces = [ 
    networkInterface
  ];

  this.Placement = {
    Tenancy:  'default'
  };
}

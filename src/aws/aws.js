'use strict';
/**
 * This module assembles/builds all primitive AWS SDK objects needed to use this
 * API, promisifies them, and locks them to a consistent version
 *
 * @module aws/aws
 */

const AWS = require('aws-sdk');
const constants = require('../constants');
const util = require('../util');

module.exports = {
  create: AwsWrapper
};

/**
 * @param {Object} credentials
 * @param {string} vpcId
 * @constructor
 */
function AwsWrapper(credentials, vpcId) {
  if (!(this instanceof AwsWrapper)) {
    return new AwsWrapper(credentials, vpcId);
  }

  AWS.config.apiVersions = constants.AWS_APIS;
  // init aws objects with credentials/promises
  this.ddb = util.makePromiseApi(new AWS.DynamoDB(credentials));
  this.elb = util.makePromiseApi(new AWS.ELB(credentials));
  this.ec2 = util.makePromiseApi(new AWS.EC2(credentials));
  this.ecr = util.makePromiseApi(new AWS.ECR(credentials));
  this.ecs = util.makePromiseApi(new AWS.ECS(credentials));
  this.iam = util.makePromiseApi(new AWS.IAM(credentials));
  this.r53 = util.makePromiseApi(new AWS.Route53(credentials));
  // init AWS 'state'
  this.vpcId = vpcId;

}

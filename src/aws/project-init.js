'use strict';

const awsProjectManager = require('./projectManager');

/**
 * @returns {Q.Promise}
 */
function initAwsProject(config) {
  var a = require('aws-sdk');
  var ec2 = new a.EC2(config.awsCredentials);
  var ecs = new a.ECS(config.awsCredentials);
  var r53 = new a.Route53(config.awsCredentials);
  var ddb = new a.DynamoDB(config.awsCredentials);

  return awsProjectManager(ec2, ecs, r53, ddb);
}

module.exports = initAwsProject;

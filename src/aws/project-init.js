'use strict';
/**
 * Sets up a ProjectManager
 *
 * @module aws/projectInit
 */

const awsProjectManager = require('./projectManager');
const makePromiseApi = require('../util').makePromiseApi;
const https = require('https');

/**
 * @returns {Q.Promise}
 */
function initAwsProject(config) {
  const a = require('aws-sdk');
  const elb = new a.ELB(config.awsCredentials);
  const ec2 = new a.EC2(config.awsCredentials);
  const ecr = new a.ECR(config.awsCredentials);
  const ecs = new a.ECS(config.awsCredentials);
  const r53 = new a.Route53(config.awsCredentials);
  /**
   * This solution is sub-optimal unfortunately DDB servers seem to have only
   * deprecated versions of TLS
   * https://github.com/aws/aws-sdk-js/issues/862
   */
  const ddb = makePromiseApi(
    new a.DynamoDB(Object.assign({
      httpOptions: {
        agent: new https.Agent({
          secureProtocol: 'TLSv1_method',
          ciphers: 'ALL'
        })
      }
    }, config.awsCredentials)));
  const iam = new a.IAM(config.awsCredentials);

  return awsProjectManager(ec2, ecs, r53, ddb, iam, ecr, elb);
}

module.exports = initAwsProject;

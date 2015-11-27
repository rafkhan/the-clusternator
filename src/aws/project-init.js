var awsProjectManager = require('./projectManager');

/**
 * @returns {Q.Promise}
 */
function initAwsProject(config) {
  var a = require('aws-sdk'),
    ec2 = new a.EC2(config.awsCredentials),
    ecs = new a.ECS(config.awsCredentials),
    r53 = new a.Route53(config.awsCredentials);

  return awsProjectManager(ec2, ecs, r53);
}

module.exports = initAwsProject;

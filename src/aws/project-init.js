var awsProjectManager = require('./projectManager');

/**
 * @returns {Q.Promise}
 */
function initAwsProject(config) {
  
  var creds = config.awsCredentials || undefined;

  var a = require('aws-sdk'),
    ec2 = new a.EC2(creds),
    ecs = new a.ECS(creds),
    r53 = new a.Route53(creds),
    ddb = new a.DynamoDB(creds);

  return awsProjectManager(ec2, ecs, r53, ddb);
}

module.exports = initAwsProject;

'use strict';

function logOutput() {
    console.log.apply(console, arguments);
}

function logError(e) {
    console.log(e.message);
}

module.exports = {
  setup: require('./setup'),
  vpc: require('./vpc.spec'),
  subnet: require('./subnet.spec'),
  securityGroups: require('./securityGroup.spec'),
  ec2: require('./ec2.spec'),
  nic: require('./nic.spec'),
  acl: require('./acl.spec'),
  project: require('./project.spec'),
  pr: require('./pr.spec'),
  routes: require('./routes.spec'),
  log: logOutput,
  error: logError
};

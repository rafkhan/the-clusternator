'use strict';
var util = require('util');

function logOutput() {
  var output = '', i;

  for (i = 0; i < arguments.length; i += 1) {
    if (typeof arguments[i] === 'object') {
      output += util.inspect(arguments[i], { depth: 5 });
    } else {
      output += arguments[i];
    }
    output += ' ';
  }
  console.log(output);
}

function logError(e) {
    console.log(e.message);
}

module.exports = {
  acl: require('./acl.spec'),
  cluster: require('./cluster.spec'),
  ec2: require('./ec2.spec'),
  nic: require('./nic.spec'),
  pr: require('./pr.spec'),
  project: require('./project.spec'),
  routes: require('./routes.spec'),
  securityGroups: require('./securityGroup.spec'),
  setup: require('./setup'),
  subnet: require('./subnet.spec'),
  vpc: require('./vpc.spec'),
  log: logOutput,
  error: logError
};

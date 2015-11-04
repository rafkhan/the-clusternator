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

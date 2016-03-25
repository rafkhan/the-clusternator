'use strict';

const setup = require('./setup');
const util = require(setup.path('util'));
const elb = require(setup.path('aws', 'ec2', 'vm', 'vm.js'));

module.exports = elb.bindAws({
  ec2: util.makePromiseApi(setup.getEc2()),
  vpcId: setup.testVPC
});


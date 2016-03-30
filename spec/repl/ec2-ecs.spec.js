'use strict';

const R = require('ramda');

var setup = require('./setup');
var util = require(setup.path('util'));
var elb = require(setup.path('aws', 'ec2', 'vm', 'vm-ecs.js'));

const partialedEc2 = R.mapObjIndexed(awsEc2Partial, elb);

function awsEc2Partial(fn) {
  if (typeof fn !== 'function'){
    return;
  }
  return R.partial(fn, { 
    ec2: util.makePromiseApi(setup.getEc2()), 
    vpcId: setup.testVPC
  });
}

module.exports = partialedEc2;

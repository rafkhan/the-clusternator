'use strict';

const setup = require('./setup');
const util = require(setup.path('util'));
const elb = require(setup.path('aws', 'elb', 'elb.js'));

module.exports = elb.bindAws({
  elb: util.makePromiseApi(setup.getElb()) 
});

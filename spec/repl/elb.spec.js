'use strict';

const R = require('ramda');

var setup = require('./setup');
var util = require(setup.path('util'));
var elb = require(setup.path('aws', 'elb', 'elb.js'));

const partialedElb = R.mapObjIndexed(iamElbPartial, elb);

function iamElbPartial(fn) {
  if (typeof fn !== 'function'){
    return;
  }
  return R.partial(fn, { elb: util.makePromiseApi(setup.getElb()) });
}

module.exports = partialedElb;

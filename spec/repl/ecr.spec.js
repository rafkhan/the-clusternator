'use strict';

const R = require('ramda');

var setup = require('./setup');
var util = require(setup.path('util'));
var ecr = require(setup.path('aws', 'ecr', 'ecr.js'));

const partialedIam = R.mapObjIndexed(iamAwsPartial, ecr);

function iamAwsPartial(fn) {
  return R.partial(fn, { ecr: util.makePromiseApi(setup.getEcr()) });
}

module.exports = partialedIam;

'use strict';

const R = require('ramda');

var setup = require('./setup');
var util = require(setup.path('util'));
var ddb = require(setup.path('aws', 'ddb', 'hash-table.js'));

function ddbAwsPartial(fn) {
  if (typeof fn === 'function') {
    return R.partial(fn, {ddb: util.makePromiseApi(setup.getDDB())});
  }
}

const partialedDDB = R.mapObjIndexed(ddbAwsPartial, ddb);

module.exports = partialedDDB;

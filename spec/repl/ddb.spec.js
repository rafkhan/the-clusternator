'use strict';

const setup = require('./setup');
const util = require(setup.path('util'));
const ddb = require(setup.path('aws', 'ddb', 'hash-table.js'));

module.exports = ddb.bindAws({
  ddb: util.makePromiseApi(setup.getDDB())
});

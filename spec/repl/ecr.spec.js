'use strict';

const setup = require('./setup');
const util = require(setup.path('util'));
const ecr = require(setup.path('aws', 'ecr', 'ecr.js'));

module.exports = ecr.bindAws({
  ecr: util.makePromiseApi(setup.getEcr()) 
});

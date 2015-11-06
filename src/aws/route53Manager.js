'use strict';

var  R = require('ramda'),
Q = require('q'),
constants = require('../constants');

function getRoute53(route53, zoneId) {

  function describe() {

  }

  function create(pid, pr, config) {
    config = config || {};
    var params = R.merge(constants.AWS_R53_SUBDOMAIN, config);
    var d = Q.defer();
    d.resolve();
    return d.promise;
  }

  function destroy() {
    var d = Q.defer();
    d.resolve();
    return d.promise;
  }

  return {
      describe: describe,
      create: create,
      destroy: destroy
  };
}

module.exports = getRoute53;

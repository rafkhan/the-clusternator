'use strict';

const WAIT_DEFAULT_INTERVAL = 10000;

var Q = require('q');

function errLog(x) {
  console.log('ERROR', x);
  return Q.reject(new Error(x));
}

function plog() {
  console.log.apply(null, arguments);
  return arguments[0];
}

/**
  @param {string}
  @return {string} (double) quoted version
*/
function quote(str) {
  return '"' + str + '"';
}

/**
  @param {string} ip '1.2.3.0/24'
  @return {string} '1.2'
*/
function getCidrPrefixFromIPString(ip) {
  var classes = ip.split('.');
  return classes[0] + '.' + classes[1];
}

/**
  @param {function(...):Q.Promise} asyncPredicateFunction
  @param {number} interval ms to retry (defaults to 10000)
  @param {number=} max maximum number of retries (default 0 for infinity)
  @param {string=} label label for debugging
  @return {Q.Promise}
*/
function waitFor(asyncPredicateFunction, interval, max, label) {
  max = Math.abs(+max) || 0;
  interval = Math.abs(+interval) || WAIT_DEFAULT_INTERVAL;

  var defer = Q.defer(),
    count = 0;

  function poll() {
    asyncPredicateFunction().then(function() {
      defer.resolve();
    }, function(err) {
      if (count > max && max > 0) {
        defer.reject(new Error('waitFor: poll: ' + label + ' too many failures: ' + count));
        return;
      }
      count += 1;
      setTimeout(poll, interval);
    });
  }
  poll();
  return defer.promise;
}

/**
  @param {*} something to test
  @return {boolean}
*/
function isFunction(fn) {
  return typeof fn === 'function';
}

/**
  @param {Object} api some collection/object of nodejs style functions
  @return {Object} a new object with promisified functions
*/
function makePromiseApi(api) {
  var promiseApi = {},
    attr;
  // wrap *all* the functions !!!
  for (attr in api)
    if (isFunction(api[attr])) {
      promiseApi[attr] = Q.nbind(api[attr], api);
    }
  return promiseApi;
}

module.exports = {
  errLog: errLog,
  plog: plog,
  isFunction: isFunction,
  quote: quote,
  getCidrPrefixFromIPString,
  waitFor: waitFor,
  makePromiseApi
};

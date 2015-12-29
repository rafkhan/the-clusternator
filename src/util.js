'use strict';

const WAIT_DEFAULT_INTERVAL = 10000;

const Q = require('q');
const inquirer = require('inquirer');
const Winston = require('winston');
const constants = require('./constants');

var winston;

initWinston();

function initWinston() {
  winston = new (Winston.Logger)({
    transports: [
      new (Winston.transports.Console)() // TODO fix minimum log level
    ]
  });
}

function info() {
  winston.info.apply(winston, arguments);
}

function debug() {
  winston.debug.apply(winston, arguments);
}

function verbose() {
  winston.verbose.apply(winston, arguments);
}

function warn() {
  winston.verbose.apply(winston, arguments);
}

function error() {
  winston.error.apply(winston, arguments);
}

function errLog(x) {
  winston.info('ERROR', x);
  return Q.reject(new Error(x));
}

function plog() {
  winston.info.apply(null, arguments);
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
    asyncPredicateFunction()
      .then(defer.resolve)
      .fail( (err) => {
        if (count > max && max > 0) {
          defer.reject(
            new Error(`waitFor: poll: ${label} too many failures: ${count}`));
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

/**
  Quick/dirty deep copy.  Will break on circular structures.
  @param {*} obj
  @return {*} copy
*/
function clone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch(err) {
    plog('Clone Warning: ', err.message);
    return null;
  }
}

function inquirerPrompt(qs) {
  var d = Q.defer();
  inquirer.prompt(qs, (answers) => {
    d.resolve(answers);
  });
  return d.promise;
}

/**
 * @param {Yargs} yargs
 */
function cliLogger(yargs) {
  const INFO = 2;
  const LOG_MAX = 5;


  var argv = yargs.count('verbose')
    .alias('v', 'verbose')
    .describe('v', 'Verbosity, defaults to info, add more v\'s to increase')
    .boolean('quiet')
    .alias('q', 'quiet')
    .describe('q', 'Quiet mode, only errors will output (overrides -v)')
    .argv;

  if (argv.q) {
    winston.transports.console.level = constants.LOG_LEVELS[0];
  } else {
    let logLevel = INFO + argv.v > LOG_MAX ? LOG_MAX : INFO + argv.v;
    winston.transports.console.level = constants.LOG_LEVELS[logLevel];
  }
}

/**
 * @param {string} string
 * @returns {null||*}
 */
function safeParse(string) {
  try {
    return JSON.parse(string);
  } catch (err) {
    return null;
  }
}


module.exports = {
  errLog: errLog,
  plog: plog,
  isFunction,
  quote: quote,
  getCidrPrefixFromIPString,
  waitFor,
  makePromiseApi,
  clone,
  info,
  debug,
  verbose,
  warn,
  error,
  winston,
  inquirerPrompt,
  cliLogger,
  safeParse
};

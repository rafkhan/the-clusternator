'use strict';
/**
 * Utility functions global to The Clusternator
 * @module util
 */

const WAIT_DEFAULT_INTERVAL = 10000;

const Q = require('q');
const inquirer = require('inquirer');
const Winston = require('winston');
const constants = require('./constants');

let winston;

initWinston();

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
  safeParse,
  isObject,
  deepFreeze
};

/**
 * @param {*} i
 * @returns {boolean}
 */
function isObject(i) {
  return i && (typeof i === 'object');
}

/**
 *  Starts up the winston logger for STDIO
 */
function initWinston() {
  winston = new (Winston.Logger)({
    transports: [
      new (Winston.transports.Console)() // TODO fix minimum log level
    ]
  });
}

/**
 * logs an info message(s) through winston (takes any args)
 */
function info() {
  winston.info.apply(winston, arguments);
}

/**
 * logs a debug message(s) through winston (takes any args)
 */
function debug() {
  winston.debug.apply(winston, arguments);
}

/**
 * logs a verbose message(s) through winston (takes any args)
 */
function verbose() {
  winston.verbose.apply(winston, arguments);
}

/**
 * logs a warning message(s) through winston (takes any args)
 */
function warn() {
  winston.verbose.apply(winston, arguments);
}

/**
 * logs an error message(s) through winston (takes any args)
 */
function error() {
  winston.error.apply(winston, arguments);
}

/**
 * Logs an info error labelled as error, and returns a Promise
 * @param {*} x
 * @returns {Promise}
 */
function errLog(x) {
  winston.info('ERROR', x);
  return Q.reject(new Error(x));
}

/**
 * @deprecated
 * @returns {*}
 */
function plog() {
  winston.info.apply(null, arguments);
  return arguments[0];
}

/**
  Double quote something
  @param {string} str
  @return {string} (double) quoted version
*/
function quote(str) {
  return '"' + str + '"';
}

/**
  @param {string} ip something like: '1.2.3.0/24'
  @return {string} first two classes, like: '1.2'
*/
function getCidrPrefixFromIPString(ip) {
  const classes = ip.split('.');
  return classes[0] + '.' + classes[1];
}

/**
  Wait function for polling something.

  Provide a function a that uses a promise to check something asynchronously.
  This "asyncPredicateFunction" should resolve when it's "ready" to proceed,
  and reject if it is not ready.

  @param {function(...):Promise} asyncPredicateFunction should resolve when its
    condition is eventually satisfied, and reject otherwise
  @param {number} interval ms to retry asyncPredicateFunction (defaults to
    10000)
  @param {number=} max maximum number of retries (default 0 for infinity)
  @param {string=} label label for debugging
  @return {Promise}
*/
function waitFor(asyncPredicateFunction, interval, max, label) {
  max = Math.abs(+max) || 0;
  interval = Math.abs(+interval) || WAIT_DEFAULT_INTERVAL;

  const defer = Q.defer();
  let count = 0;

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
  Is the given argument a function?
  @param {*} fn to test
  @return {boolean}
*/
function isFunction(fn) {
  return typeof fn === 'function';
}

/**
  Shallow iterates over a given object and *assumes* all functions are node
  callback style and converts them to Promises
  @param {Object} api some collection/object of nodejs style functions
  @return {Object} a new object with promisified functions
*/
function makePromiseApi(api) {
  const promiseApi = {};
  let attr;
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

/**
 * Uses inquirer to prompt for STDIO input/output
 * @todo move this to a CLI utility section
 * @param {Array} qs
 * @param {function(...)=} onEachAnswer
 * @param {function(...)=} onEachError
 * @param {function(...)=} onComplete
 * @returns {Promise}
 */
function inquirerPrompt(qs, onEachAnswer, onEachError, onComplete) {
  const d = Q.defer();
  if (typeof onEachAnswer === 'function') {
    inquirer.prompt(qs, (answers) => {
      d.resolve(answers);
    }).process.subscribe(onEachAnswer, onEachError, onComplete);
  } else {
    inquirer.prompt(qs, (answers) => {
      d.resolve(answers);
    });
  }
  return d.promise;
}

/**
 * Sets up verbosity for the CLI
 * @todo move this function into the CLI api, or somewhere else
 * @param {Object} yargs
 */
function cliLogger(yargs) {
  const INFO = 2;
  const LOG_MAX = 5;


  const argv = yargs.count('verbose')
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
 * Makes an object and its parts immutable
 * @param {Object} obj
 * @returns {Object}
 */
function deepFreeze(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  Object.keys(obj).forEach((prop) => obj[prop] = isObject(obj[prop]) ?
    deepFreeze(obj[prop]) :
    obj[prop]);
  return Object.freeze(obj);
}

/**
 * @param {string} string
 * @returns {null|*}
 */
function safeParse(string) {
  try {
    return JSON.parse(string);
  } catch (err) {
    return null;
  }
}


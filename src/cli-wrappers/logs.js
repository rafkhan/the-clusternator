'use strict';

const path = require('path');

var cproc = require('./child-process');

const COMMAND_APP = path.join(
  __dirname, '..', '..', 'bin', 'log-app.sh');
const COMMAND_ECS = path.join(
  __dirname, '..', '..', 'bin', 'log-ecs.sh');

/**
 * @param {string} host
 * @returns {Q.Promise}
 */
function logApp(host) {
  if (!host) {
    throw new TypeError('logApp requires a host from');
  }

  return cproc.inherit(COMMAND_APP, [host], { stdio: 'inherit' });
}

/**
 * @param {string} host
 * @returns {Q.Promise}
 */
function logEcs(host) {
  if (!host) {
    throw new TypeError('logEcs requires a host to log from');
  }

  return cproc.inherit(COMMAND_ECS, [host], { stdio: 'inherit' });
}

module.exports = {
  logEcs,
  logApp
};

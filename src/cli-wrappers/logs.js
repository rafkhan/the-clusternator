const spawn = require('child_process').spawn,
  path = require('path'),
  util = require('../util'),
  Q = require('q');

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

  var d = Q.defer(),
    log = spawn(COMMAND_APP, [host], { stdio: 'inherit' });

  log.on('close', (code) => {
    if (+code) {
      d.reject(
        new Error(`logApp terminated with exit code: ${code} msg: ${error}`));
    } else {
      d.resolve(output);
    }
  });

  return d.promise;
}

/**
 * @param {string} host
 * @returns {Q.Promise}
 */
function logEcs(host) {
  if (!host) {
    throw new TypeError('logEcs requires a host to log from');
  }

  var d = Q.defer(),
    log = spawn(COMMAND_APP, [host], { stdio: 'inherit' });

  log.on('close', (code) => {
    if (+code) {
      d.reject(
        new Error(`logEcs terminated with exit code: ${code} msg: ${error}`));
    } else {
      d.resolve(output);
    }
  });

  return d.promise;
}

module.exports = {
  logEcs,
  logApp
};

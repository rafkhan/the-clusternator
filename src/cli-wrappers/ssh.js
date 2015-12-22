'use strict';

const COMMAND = 'ssh',
  USER = 'ec2-user@',
  FLAG_PORT = '-p',
  BASE_SSH_ARGS = [
    '-oStrictHostKeyChecking=no', '-oUserKnownHostsFile=/dev/null'];

var spawn = require('child_process').spawn,
  Q = require('q');

/**
 * ssh's as ec2-user
 * @param {string} host
 * @param {string=} port
 * @returns {Q.Promise}
 */
function shell(host, port) {
  host = USER + host;
  var d = Q.defer(),
    args = port ? [FLAG_PORT, port, host] : [host],
    ssh = spawn(COMMAND, args.concat(BASE_SSH_ARGS), { stdio: 'inherit' });

  ssh.on('close', (code) => {
    if (+code) {
      d.reject(new Error('npm terminated with exit code: ' + code));
    } else {
      d.resolve();
    }
  });

  return d.promise;
}


module.exports = {
  shell
};
'use strict';
/**
 * This module provides promise based shortcuts to the `ssh` command
 *
 * @module childProcess/ssh
 */

const COMMAND = 'ssh';
const USER = 'ec2-user@';
const FLAG_PORT = '-p';
const BASE_SSH_ARGS = [
    '-oStrictHostKeyChecking=no', '-oUserKnownHostsFile=/dev/null'];

let cproc = require('./child-process');

/**
 * ssh's as ec2-user
 * @param {string} host
 * @param {string=} port
 * @returns {Q.Promise}
 */
function shell(host, port) {
  host = USER + host;
  const args = port ? [FLAG_PORT, port, host] : [host];
  return cproc.inherit(COMMAND,
    args.concat(BASE_SSH_ARGS), { stdio: 'inherit' });
}


module.exports = {
  shell
};
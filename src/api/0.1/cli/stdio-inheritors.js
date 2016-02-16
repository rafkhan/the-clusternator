'use strict';
/**
 * This module is an "endware" that serves {@link module:api/'0.1'/cli}
 * this module provides functions that are designed to inherit the current STDIO
 * and eventually end/die, often with Ctrl-c
 *
 * @module api/'0.1'/cli/stdioInheritors
 */

const Q = require('q');
const fs = require('../project-fs/project-fs');
const path = require('path');
const mkdirp = Q.nfbind(require('mkdirp'));

let logSsh = require('./log-ssh');
const clusternatorJson = require('../project-fs/clusternator-json');

const cmn = require('../common');
const util = cmn.src('util');
const constants = cmn.src('constants');
let sshKey = cmn.src('cli-wrappers', 'ssh-keygen');
let ssh = cmn.src('cli-wrappers', 'ssh');
let logRemote = cmn.src('cli-wrappers', 'logs');


module.exports = {
  newSshKey,
  sshShell,
  logApp,
  logEcs
};

function newSshKey(name) {
  return Q.all([
      fs.findProjectRoot(),
      clusternatorJson.get()])
    .then((results) => {
      const publicPath =
        path.join(results[0], results[1].private, constants.SSH_PUBLIC_PATH);
      return mkdirp(publicPath)
        .then(() => sshKey(name, publicPath));
    });
}

/**
 * @param {function(...):Q.Promise} logFn
 */
function remoteFn(logFn) {
  return logSsh
    .listSSHAbleInstances()
    .then((instanceDetails) => {
      if (!instanceDetails.length) {
        util.info('Sorry no instances available to log into');
        return;
      }
      return util
        .inquirerPrompt([{
          name: 'chosenBox',
          type: 'list',
          choices: instanceDetails.map((id) => id.str),
          message: 'Choose a Box to Log' }])
        .then((answers) => logFn(instanceDetails
          .filter((id) => id.str === answers.chosenBox)
          .map((id) => id.ip )[0])); });
}

function sshShell() {
  return remoteFn(ssh.shell)
    .done();
}

/**
 * @param {Error} err
 */
function logFail(err) {
  const code = +err.code;
  if (code === 1) {
    console.log('');
    console.log('Error: Can connect to host, but cannot find Docker ' +
      'container:');
    console.log('Try manually debugging using "clusternator ssh"');
  }  else {
    console.log(`stdio Error: ${err.message}`);
  }
}

function logApp() {
  return remoteFn(logRemote.logApp)
    .fail(logFail)
    .done();
}

function logEcs() {
  return remoteFn(logRemote.logEcs)
    .fail(logFail)
    .done();
}

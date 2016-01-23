'use strict';

const Q = require('q');
const fs = require('fs');
const path = require('path');
const mkdirp = Q.nfbind(require('mkdirp'));

const logSsh = require('./log-ssh');
const cn = require('../js/js-api');

const cmn = require('../common');
const clusternatorJson = cmn.src('clusternator-json');
const util = cmn.src('util');
const constants = cmn.src('constants');
const sshKey = cmn.src('cli-wrappers', 'ssh-keygen');
const ssh = cmn.src('cli-wrappers', 'ssh');
const logRemote = cmn.src('cli-wrappers', 'logs');


module.exports = {
  newSshKey,
  sshShell,
  logApp,
  logEcs
};

function newSshKey(name) {
  return Q.all([
      clusternatorJson.findProjectRoot(),
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

function logApp() {
  return remoteFn(logRemote.logApp)
    .done();
}

function logEcs() {
  return remoteFn(logRemote.logEcs)
    .done();
}

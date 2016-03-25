'use strict';
/**
 * This module is a middleware that sits between {@link module:api/'0.1'/cli}
 and {@link module:api/'0.1'/clusternator}

 This module deals with helping the user manage their project databases
 * @module api/'0.1'/cli/projectDb
 */

const cmn = require('../common');
const util = cmn.src('util');
let cn = require('../js/js-api');
const cj = require('../project-fs/clusternator-json');
const privateFs = require('../project-fs/private');

module.exports = {
  createData,
  resetAuth,
  resetShared,
  resetGitHub,
  getShared,
  getGitHub,
  logCreateData
};

/**
 * @returns {Q.Promise.<string>}
 */
function getProjectId() {
  return cj.get()
    .then((cJson) => cJson.projectId);
}

function logLoop(someChar, val) {
  val = parseInt(val, 10) >= 0 ? parseInt(val, 10) : 80;
  console.log(new Array(val).join(someChar));
}

function logCreateData(results) {
  console.log('');
  console.log('');
  logLoop('-');
  console.log('GitHub Key: (For GitHub requests)');
  console.log(results.gitHubKey);
  logLoop('-');
  console.log('Shared Key: (For project\'s encrypted/private data)');
  console.log(results.sharedKey);
  logLoop('-');
  console.log('');
}

function log(data) {
  console.log(data);
}

function logError(message, data) {
  console.log(`Project DB Error: ${message}: ${data}`);
}

function createData(channel) {
  return getProjectId()
    .then((projectId) => cn
      .createProjectData(projectId, channel))
    .then((results) => {
      logCreateData(results);
      return privateFs.writeClusternatorCreds(results.authToken);
    });
}

function resetAuth() {
  return getProjectId()
    .then((projectId) => cn
      .resetProjectAuth(projectId))
    .then(log);
}

function resetShared() {
  return getProjectId()
    .then((projectId) => cn
      .resetProjectShared(projectId))
    .then(log);
}

function resetGitHub() {
  return getProjectId()
    .then((projectId) => cn
      .resetProjectGitHub(projectId))
    .then(log);
}

function getShared() {
  return getProjectId()
    .then((projectId) => cn
      .getProjectShared(projectId))
    .then(log);
}

function getGitHub() {
  return getProjectId()
    .then((projectId) => cn
      .getProjectGitHub(projectId))
    .then(log);
}

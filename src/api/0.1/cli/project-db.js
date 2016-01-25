'use strict';

const cmn = require('../common');
const util = cmn.src('util');
const cn = require('../js/js-api');
const cj = require('../project-fs/clusternator-json');

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
  console.log(`Error: ${message}: ${data}`);
}

function createData(channel) {
  return getProjectId()
    .then((projectId) => cn
      .createProjectData(projectId, channel))
    .then((results) => logCreateData(results))
    .fail((err) => logError('creating Project Data', err.message));
}

function resetAuth() {
  return getProjectId()
    .then((projectId) => cn
      .resetProjectAuth(projectId))
    .then(log)
    .fail((err) => logError('resetting auth token', err.message));
}

function resetShared() {
  return getProjectId()
    .then((projectId) => cn
      .resetProjectShared(projectId))
    .then(log)
    .fail((err) => logError('resetting shared key', err.message));
}

function resetGitHub() {
  return getProjectId()
    .then((projectId) => cn
      .resetProjectGitHub(projectId))
    .then(log)
    .fail((err) => logError('resetting GitHub key', err.message));
}

function getShared() {
  return getProjectId()
    .then((projectId) => cn
      .getProjectShared(projectId))
    .then(log)
    .fail((err) => logError('getting shared key', err.message));
}

function getGitHub() {
  return getProjectId()
    .then((projectId) => cn
      .getProjectGitHub(projectId))
    .then(log)
    .fail((err) => logError('getting GitHub key', err.message));
}

'use strict';
/**
 * Interface for bridging project DB functions from CLI to REST api
 *
 * @module clusternator/projectData
 */

const MISSING_PROJ = 'missing projectId';
const MISSING_CHANNEL = 'missing slack channel name';

const makePostRequest = require('./common').makePostRequest;
const Q = require('q');

module.exports = {
  create,
  resetAuth,
  resetShared,
  resetGitHub,
  getShared,
  getGitHub,
  changeSlackChannel
};

/**
 * @param {string} projectId
 * @param {string=} repoName
 * @param {string=} channel
 * @returns {Q.Promise<{ sharedKey: string, authToken: string,
 gitHubToken: string }>}
 */
function create(projectId, repoName, channel) {
  if (!projectId) {
    return Q.reject(new Error(MISSING_PROJ));
  }
  return makePostRequest('/project/create-data', {
    projectId,
    repoName: repoName || projectId,
    channel: channel || projectId
  });
}

/**
 * @param {string} projectId
 * @returns {Q.Promise<string>}
 */
function resetAuth(projectId) {
  if (!projectId) {
    return Q.reject(new Error(MISSING_PROJ));
  }
  return makePostRequest('/project/reset-auth-token', {
    projectId
  }).then((data) => data.data);

}

/**
 * @param {string} projectId
 * @returns {Q.Promise<string>}
 */
function resetGitHub(projectId) {
  if (!projectId) {
    return Q.reject(new Error(MISSING_PROJ));
  }
  return makePostRequest('/project/reset-git-hub-key', {
    projectId
  }).then((data) => data.data);
}

/**
 * @param {string} projectId
 * @returns {Q.Promsie<string>}
 */
function resetShared(projectId) {
  if (!projectId) {
    return Q.reject(new Error(MISSING_PROJ));
  }
  return makePostRequest('/project/reset-shared-key', {
    projectId
  }).then((data) => data.data);
}

/**
 * @param {string} projectId
 * @returns {Q.Promise<string>}
 */
function getGitHub(projectId) {
  if (!projectId) {
    return Q.reject(new Error(MISSING_PROJ));
  }
  return makePostRequest('/project/git-hub-key', {
    projectId
  }).then((data) => data.data);
}

/**
 * @param {string} projectId
 * @returns {Q.Promise<string>}
 */
function getShared(projectId) {
  if (!projectId) {
    return Q.reject(new Error(MISSING_PROJ));
  }
  return makePostRequest('/project/shared-key', {
    projectId
  }).then((data) => data.data);
}

/**
 * @param {string} projectId
 * @param {string} channel
 * @returns {Q.Promise<string>}
 */
function changeSlackChannel(projectId, channel) {
  if (!projectId) {
    return Q.reject(new Error(MISSING_PROJ));
  }
  if (!channel) {
    return Q.reject(new Error(MISSING_CHANNEL));
  }
  return makePostRequest('/project/change-slack-channel', {
    projectId,
    channel
  }).then((data) => data.data);

}

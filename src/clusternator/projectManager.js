'use strict';

const Q = require('q');
const constants = require('../constants');
const makePostRequest = require('./common').makePostRequest;

module.exports = getProjectManager;

function getProjectManager() {
  return {
    create,
    createPR,
    createDeployment,
    destroy,
    destroyDeployment,
    describeProject,
    listProjects
  };
}

function listProjects() {
}

/**
 * @param {string} projectId
 * @returns {Q.Promise}
 */
function create(projectId) {
  if (!projectId) {
    return Q.reject(new Error('projectManager.create requires a projectId'));
  }
  return makePostRequest('/project/create', { projectId });
}

function createPR() {

}

function createDeployment() {

}

function destroy() {

}

function destroyDeployment() {

}

function describeProject() {

}


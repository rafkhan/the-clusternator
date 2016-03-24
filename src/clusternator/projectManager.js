'use strict';
/**
 * Clusternator REST API's CLI projectManager interface
 *
 * @module clusternator/projectManager
 */

const Q = require('q');
const cmn = require('./common');
const util = require('../util');
const constants = require('../constants');
const makePostRequest = require('./common').makePostRequest;
const deploymentsREST = require('../api/0.1/common').src('clusternator',
                                                         'deployments');

module.exports = getProjectManager;

function getProjectManager() {
  return {
    create,
    createPR,
    createDeployment,
    destroy,
    destroyDeployment,
    describeProject,
    listProjects,
    listSSHAbleInstances
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


/**
 * @param {string} projectId
 * @returns {Q.Promise}
 */
function listSSHAbleInstances(projectId) {
  if (!projectId) {
    return Q.reject(new Error('projectManager.create requires a projectId'));
  }
  return makePostRequest('/project/list-ssh-instances', { projectId });
}

function createPR() {

}

function createDeployment(projectId, name, deploymentDesc, sshData, force) {
  return deploymentsREST.create(projectId, name, deploymentDesc,
                                sshData, force);
}

function destroy() {

}

function destroyDeployment(projectId, name) {
  return deploymentsREST.destroy(projectId, name);
}

function describeProject() {

}


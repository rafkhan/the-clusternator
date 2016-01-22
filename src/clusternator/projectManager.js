'use strict';

const Q = require('q');
const constants = require('../constants');
const makePostRequest = require('./common').makePostRequest;



function getProjectManager() {
  var d = Q.defer();

  init();

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

  function init() {
    d.resolve({
      create,
      createPR,
      createDeployment,
      destroy,
      destroyDeployment,
      describeProject,
      listProjects
    });
  }
  return d.promise;
}

module.exports = getProjectManager;


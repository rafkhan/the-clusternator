'use strict';
/**
 * The clusternator public JavaScript API
 *
 *
 * @module Clusternator
 */

const Q = require('q');

const cmn = require('../common');
const Config = cmn.src('config');
const util = cmn.src('util');
const constants = cmn.src('constants');

const gpg = cmn.src('cli-wrappers', 'gpg');

const userREST = cmn.src('clusternator', 'user');
const projectREST = cmn.src('clusternator', 'project-data');
const cnProjectManager = cmn.src('clusternator', 'projectManager');
const awsProjectManager = cmn.src('aws', 'project-init');


module.exports = {
  awsProjectManager,
  getProjectAPI,
  provisionProjectNetwork,
  listSSHAbleInstances,
  deploy,
  stop,
  update,
  startServer,
  describeServices,
  listProjects,
  certUpload,
  certList,
  createUser,
  login,
  changePassword,
  generatePass: gpg.generatePass,
  createProjectData,
  resetProjectAuth,
  resetProjectShared,
  resetProjectGitHub,
  getProjectShared,
  getProjectGitHub
};

function createProjectData(projectId, channel) {
  return projectREST.create(projectId, channel);
}

function resetProjectAuth(projectId) {
  return projectREST.resetAuth(projectId);
}

function resetProjectShared(projectId) {
  return projectREST.resetShared(projectId);
}

function resetProjectGitHub(projectId) {
  return projectREST.resetGitHub(projectId);
}

function getProjectShared(projectId) {
  return projectREST.getShared(projectId);
}

function getProjectGitHub(projectId) {
  return projectREST.getGitHub(projectId);
}

/**
 * @param {string} username
 * @param {string} password
 * @param {string} newPassword
 * @param {string} confirmPassword
 * @returns {Q.Promise}
 */
function changePassword(username, password, newPassword, confirmPassword) {
  if (!username || !password) {
    return Q.reject(new Error('changePassword requires a username, and ' +
      'password'));
  }
  if (newPassword !== confirmPassword) {
    return Q.reject(new Error('password mismatch'));
  }
  userREST.changePassword();
}

/**
 * @param {string} username
 * @param {string} password
 * @returns {Q.Promise}
 */
function login(username, password) {
  if (!username || !password) {
    return Q.reject(new Error('login requires password, and username'));
  }
  return userREST.login(username, password);
}

/**
 * @param {string} username
 * @param {string} password
 * @param {string} confirm
 * @param {number=} authority
 * @returns {Q.Promise}
 */
function createUser(username, password, confirm, authority) {
  if (password !== password) {
    return Q.reject(new Error('password mismatch'));
  }
  return userREST.create(username, password, confirm, authority);
}

/**
 * @param {string} projectId
 * @returns {Q.Promise}
 */
function provisionProjectNetwork(projectId) {
  return getProjectAPI()
    .create(projectId);
}

/**
 * @returns {{ create: function(...):Q.Promise,
  listSSHAbleInstances: function(...)Q.Promise }}
 */
function getProjectAPI() {
  var config = Config();

  if (config.awsCredentials) {
    return awsProjectManager(config);
  }
  return cnProjectManager(config);
}

/**
 * @param {string} projectId
 * @returns {Q.Promise}
 */
function listSSHAbleInstances(projectId) {
  return getProjectAPI()
    .listSSHAbleInstances(projectId);
}

/**
 * @param {string} name
 * @param {string} projectId
 * @param {Object} deploymentDesc
 */
function deploy(name, projectId, deploymentDesc) {
  const pm = getProjectAPI();
  return deploy_(pm, projectId, deploymentDesc, name)
    .fail((err) => {
      util.info('Clusternator: Error creating deployment: ' + err.message);
      util.info(err.stack);
    });
}

/**
 * @param {string} name
 * @param {string} projectId
 * @returns {Q.Promise}
 */
function stop(name, projectId) {
  return getProjectAPI()
    .destroyDeployment(
      projectId,
      name);
}

/**
 * @param {string} name
 * @param {string} projectId
 * @param {Object} deploymentDesc
 */
function update(name, projectId, deploymentDesc) {
  const pm = getProjectAPI();
  return update_(pm, projectId, deploymentDesc, name)
    .fail((err) => {
      util.info('Clusternator: Error updating deployment: ' + err.message);
      util.info(err.stack);
    });
}


/**
 * @param {Object} config
 * @returns {Q.Promise}
 */
function startServer(config) {
  const server = cmn.src('server', 'main');
  return server.startServer(config);
}

/**
 * @param {ProjectManager} pm
 * @param {string} projectId
 * @param {string} appDefStr
 * @param {string} deployment
 * @returns {Request|Promise.<T>}
 * @private
 */
function deploy_(pm, projectId, appDefStr, deployment) {
  util.info('Requirements met, creating deployment...');
  var appDef = util.safeParse(appDefStr);
  if (!appDef) {
    throw new Error('Deployment failed, error parsing appDef');
  }
  const config = Config();
  return pm.createDeployment(
    projectId,
    deployment,
    appDef,
    config.useInternalSSL || false
  ).then((result) => {
    util.info('Deployment will be available at ', result);
  });
}

/**
 * @param {ProjectManager} pm
 * @param {string} projectId
 * @param {string} appDefStr
 * @param {string} deployment
 * @returns {Request|Promise.<T>}
 * @private
 */
function update_(pm, projectId, appDefStr, deployment) {
  util.info('Updating deployment...');
  var appDef = util.safeParse(appDefStr);
  if (!appDef) {
    throw new Error('Deployment failed, error parsing appDef');
  }

  return pm.updateDeployment(
    projectId,
    deployment,
    appDef
  ).then((result) => {
    util.info('Deployment updated', result);
  }, (err) => {
    return Q.reject(err);
  });
}


/**
 * @returns {Q.Promise<string[]>}
 */
function listProjects() {
  return getProjectAPI()
    .listProjects();
}

/**
 * @param {string} projectId
 * @returns {Q.Promise}
 */
function describeServices(projectId) {
  return getProjectAPI()
    .describeProject(projectId);
}

/**
 * @param {string} certId
 * @param {string} certs
 * @returns {Q.Promise}
 */
function certUpload(certId, certs) {
  return getProjectAPI()
    .iam
    .uploadServerCertificate(
      certs.certificate, certs.privateKey, certs.chain, certId);
}

/**
 * @returns {Q.Promise}
 */
function certList() {
  return getProjectAPI()
    .iam
    .listServerCertificates();
}


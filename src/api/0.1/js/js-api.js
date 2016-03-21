'use strict';
/**
 * The clusternator public JavaScript API
 *
 * @module api/'0.1'/clusternator
 * @version 0.1.0
 */

const Q = require('q');

const cmn = require('../common');
const Config = cmn.src('config');
const util = cmn.src('util');
const constants = cmn.src('constants');

const gpg = cmn.src('cli-wrappers', 'gpg');

const userREST = cmn.src('clusternator', 'user');
const authoritiesREST = cmn.src('clusternator', 'authorities');
const projectREST = cmn.src('clusternator', 'project-data');
const cnProjectManager = cmn.src('clusternator', 'projectManager');
const awsProjectManager = cmn.src('aws', 'project-init');
const deploymentsREST = cmn.src('clusternator','deployments');

module.exports = {
  awsProjectManager,
  getProjectAPI,
  provisionProjectNetwork,
  listAuthorities,
  listSSHAbleInstances,
  listDeployments,
  deploymentExists,
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
 * @returns {Promise}
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
 * @return {Promise}
 */
function listAuthorities() {
  return authoritiesREST.list();
}

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise}
 */
function login(username, password) {
  if (!username || !password) {
    return Q.reject(new Error('login requires password, and username'));
  }
  return userREST.login(username, password);
}

/**
 * @param {string} username
 * @param {string} confirm
 * @param {number=} authority
 * @returns {Promise}
 */
function createUser(username, password, confirm, authority) {
  if (password !== password) {
    return Q.reject(new Error('password mismatch'));
  }
  return userREST.create(username, password, confirm, authority);
}

/**
 * @param {string} projectId
 * @returns {Promise}
 */
function provisionProjectNetwork(projectId) {
  return getProjectAPI()
    .create(projectId);
}

/**
 * @return {{ create: function(...), listSSHAbleInstances: function(...) }}
 */
function getProjectAPI() {
  const config = Config();

  if (config.awsCredentials) {
    return awsProjectManager(config);
  }
  return cnProjectManager(config);
}

/**
 * @param {string} projectId
 * @returns {Promise}
 */
function listSSHAbleInstances(projectId) {
  return getProjectAPI()
    .listSSHAbleInstances(projectId);
}

/**
 * @param {string} projectId
 * @returns {Promise}
 */
function listDeployments(projectId) {
  return getProjectAPI()
    .listDeployments(projectId);
}

/**
 * @param {string} projectId
 * @returns {Promise}
 */
function deploymentExists(projectId) {
  return getProjectAPI()
    .deploymentExists(projectId);
}

/**
 * @param {string} name
 * @param {string} projectId
 * @param {Object} deploymentDesc
 * @param {*=} sshData
 * @param {boolean=} force
 * @return {Promise}
 */
function deploy(name, projectId, deploymentDesc, sshData, force) {
  return getProjectAPI()
    .createDeployment(projectId, name, deploymentDesc, sshData, force);
}

/**
 * @param {string} name
 * @param {string} projectId
 * @returns {Promise}
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
 * @returns {Promise}
 */
function startServer(config) {
  const server = cmn.src('server', 'main');
  return server.startServer(config);
}

/**
 * @param {Object} pm
 * @param {string} projectId
 * @param {string} appDefStr
 * @param {string} deployment
 * @param {*=} sshData
 * @param {boolean=} force
 * @returns {Promise}
 * @private
 */
function deploy_(pm, projectId, appDefStr, deployment, sshData, force) {
  util.info('Requirements met, creating deployment...');
  const appDef = util.safeParse(appDefStr);
  if (!appDef) {
    throw new Error('Deployment failed, error parsing appDef');
  }
  return pm.createDeployment(
    projectId,
    deployment,
    appDef,
    sshData,
    force
  ).then((result) => {
    util.info('Deployment will be available at ', result);
  });
}

/**
 * @param {Object} pm
 * @param {string} projectId
 * @param {string} appDefStr
 * @param {string} deployment
 * @returns {Promise}
 * @private
 */
function update_(pm, projectId, appDefStr, deployment) {
  util.info('Updating deployment...');
  const appDef = util.safeParse(appDefStr);
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
 * @returns {Promise<string[]>}
 */
function listProjects() {
  return getProjectAPI()
    .listProjects();
}

/**
 * @param {string} projectId
 * @returns {Promise<Object[]>}
 */
function describeServices(projectId) {
  return getProjectAPI()
    .describeProject(projectId);
}

/**
 * @param {string} certId
 * @param {string} certs
 * @returns {Promise}
 */
function certUpload(certId, certs) {
  return getProjectAPI()
    .iam
    .uploadServerCertificate(
      certs.certificate, certs.privateKey, certs.chain, certId);
}

/**
 * @returns {Promise}
 */
function certList() {
  return getProjectAPI()
    .iam
    .listServerCertificates();
}


'use strict';

const Q = require('q');

const cmn = require('../common');
const Config = cmn.src('config');
const util = cmn.src('util');
const constants = cmn.src('constants');

const fs = require('../project-fs/fs');
const privateFs = require('../project-fs/private');
const deploymentsFs = require('../project-fs/deployments');
const dockerFs = require('../project-fs/docker');
const scriptsFs = require('../project-fs/clusternator-scripts');

const gpg = cmn.src('cli-wrappers', 'gpg');

const userREST = cmn.src('clusternator', 'user');
const cnProjectManager = cmn.src('clusternator', 'projectManager');
const awsProjectManager = cmn.src('aws', 'project-init');


module.exports = {
  provisionProjectNetwork,
  listSSHAbleInstances,
  getProjectAPI,
  deploy,
  stop,
  update,
  startServer,
  initProject,
  describeServices,
  listProjects,
  certUpload,
  certList,
  createUser,
  login,
  changePassword,
  generatePass: gpg.generatePass
};

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

function initializeSharedKey() {
  return gpg.generatePass();
}



/**
 * @param {string} projectId
 * @param {string} privatePath
 * @returns {Q.Promise}
 */
function provisionProjectNetwork(projectId, privatePath) {
  return getProjectAPI()
    .then((pm) =>  pm
      .create(projectId)
      .then((details) => privateFs.writeProjectDetails(privatePath, details)
        .then((token) => privateFs
          .writeClusternatorCreds(privatePath, details.ghToken)))
      .fail(Q.reject));
}

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
    .then((pm) => pm.listSSHAbleInstances(projectId));
}

/**
 * @param {string} name
 * @param {string} projectId
 * @param {Object} deploymentDesc
 * @param {string} sha
 */
function deploy(name, projectId, deploymentDesc, sha) {
  return getProjectAPI()
    .then((pm) => deploy_(pm, projectId, deploymentDesc, name, sha))
    .fail((err) => {
      util.info('Clusternator: Error creating deployment: ' + err.message);
      util.info(err.stack);
    });
}

/**
 * @param {string} name
 * @param {string} projectId
 * @param {string} sha
 * @returns {Q.Promise}
 */
function stop(name, projectId, sha) {
  return getProjectAPI()
    .then((pm) => {

      return pm.destroyDeployment(
        projectId,
        name,
        sha
      );
    });
}

/**
 * @param {string} name
 * @param {string} projectId
 * @param {Object} deploymentDesc
 * @param {string} sha
 */
function update(name, projectId, deploymentDesc, sha) {
  return getProjectAPI()
    .then((pm) => update_(pm, projectId, deploymentDesc, name, sha))
    .fail((err) => {
      util.info('Clusternator: Error updating deployment: ' + err.message);
      util.info(err.stack);
    });
}


function startServer(config) {
  const server = cmn.src('server', 'main');
  return server.startServer(config);
}

/**
 * @param {ProjectManager} pm
 * @param {string} projectId
 * @param {string} appDefStr
 * @param {string} deployment
 * @param {string} sha
 * @returns {Request|Promise.<T>}
 * @private
 */
function deploy_(pm, projectId, appDefStr, deployment, sha) {
  util.info('Requirements met, creating deployment...');
  var appDef = util.safeParse(appDefStr);
  if (!appDef) {
    throw new Error('Deployment failed, error parsing appDef');
  }
  const config = Config();
  return pm.createDeployment(
    projectId,
    deployment,
    sha,
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
 * @param {string} sha
 * @returns {Request|Promise.<T>}
 * @private
 */
function update_(pm, projectId, appDefStr, deployment, sha) {
  util.info('Updating deployment...');
  var appDef = util.safeParse(appDefStr);
  if (!appDef) {
    throw new Error('Deployment failed, error parsing appDef');
  }

  return pm.updateDeployment(
    projectId,
    deployment,
    sha,
    appDef
  ).then((result) => {
    util.info('Deployment updated', result);
  }, (err) => {
    return Q.reject(err);
  });
}

function logKey(sharedKey) {
  console.log('');
  console.log('Share this *SECRET* key with your team members');
  console.log('Also use it as CLUSTERNATOR_SHARED_KEY on CircleCi');
  console.log(`CLUSTERNATOR_SHARED_KEY ${sharedKey}`);
  console.log('');
}

/**
 * @param {string} root
 * @param {{ deploymentsDir: string, clusternatorDir: string,
 projectId: string, backend: string, tld: string, circleCi: boolean }} options
 * @param skipNetwork
 * @returns {Request|Promise.<T>|*}
 */
function initProject(root, options, skipNetwork) {
  var dDir = options.deploymentsDir,
    cDir = options.clusternatorDir,
    projectId = options.projectId,
    dockerType = options.backend;

  return Q
    .allSettled([
      deploymentsFs.init(dDir, projectId, options.ports),
      scriptsFs.init(cDir, options.tld),
      scriptsFs.initOptional(options, root),
      dockerFs.init(cDir, dockerType)])
    .then(() => {
      if (skipNetwork) {
        util.info('Network Resources *NOT* Checked');
        return;
      }

      return provisionProjectNetwork(projectId, options.private)
        .then(initializeSharedKey)
        .then((sharedKey) => privateFs.makePrivate(sharedKey)
          .then(() => privateFs.readPrivate(sharedKey))
          .then(privateFs.checksum)
          .then(() => logKey(sharedKey)));
    });
}

/**
 * @returns {Q.Promise<string[]>}
 */
function listProjects() {
  return getProjectAPI()
    .then((pm) => pm
      .listProjects());
}

/**
 * @param {string} projectId
 * @returns {Q.Promise}
 */
function describeServices(projectId) {
  return getProjectAPI()
    .then((pm) => pm
      .describeProject(projectId));
}

/**
 * @param {string} privateKey
 * @param {string} certificate
 * @param {string} certId
 * @param {string=} chain
 * @return {Q.Promise}
 */
function certUpload(privateKey, certificate, certId, chain) {
  return fs.loadCertificateFiles(privateKey, certificate, chain)
  .then((certs) => getProjectAPI()
    .then((pm) => pm.iam
      .uploadServerCertificate(
        certs.certificate, certs.privateKey, certs.chain, certId)));
}

/**
 * @returns {Q.Promise}
 */
function certList() {
  return getProjectAPI()
    .then((pm) => pm.iam
      .listServerCertificates());
}

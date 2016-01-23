'use strict';

const UTF8 = 'utf8';

const Q = require('q');
const path = require('path');
const mkdirp = Q.nfbind(require('mkdirp'));

const cmn = require('../common');
const clusternatorJson = cmn.src('clusternator-json');
const Config = cmn.src('config');
const util = cmn.src('util');
const constants = cmn.src('constants');

const fs = require('../project-fs/fs');
const privateFs = require('../project-fs/private');
const deploymentsFs = require('../project-fs/deployments');
const dockerFs = require('../project-fs/docker');
const scriptsFs = require('../project-fs/clusternator-scripts');

const gpg = cmn.src('cli-wrappers', 'gpg');
const git = cmn.src('cli-wrappers', 'git');
const docker = cmn.src('cli-wrappers', 'docker');


const userAPI = cmn.src('clusternator', 'user');
const cnProjectManager = cmn.src('clusternator', 'projectManager');
const awsProjectManager = cmn.src('aws', 'project-init');


module.exports = {
  getProjectRootRejectIfClusternatorJsonExists,
  provisionProjectNetwork,
  listSSHAbleInstances,
  getProjectAPI,
  deploy,
  stop,
  update,
  startServer,
  initProject,
  makePrivate,
  readPrivate,
  dockerBuild,
  describeServices,
  listProjects,
  certUpload,
  certList,
  createUser,
  login,
  changePassword,
  generatePass: git.generatePass
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
  userAPI.changePassword();
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
  return userAPI.login(username, password);
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
  return userAPI.create(username, password, confirm, authority);
}

/**
 * @returns {Q.Promise<string>}
 */
function getProjectRootRejectIfClusternatorJsonExists() {
  return clusternatorJson
    .findProjectRoot()
    .then((root) => clusternatorJson
      .skipIfExists(root)
      .then(() => root ));
}

function initializeSharedKey() {
  return gpg.generatePass();
}



/**
 * @param {string} projectId
 * @param {string} output
 * @param {string} privatePath
 * @returns {Q.Promise}
 */
function provisionProjectNetwork(projectId, output, privatePath) {
  return getProjectAPI()
    .then((pm) =>  pm
      .create(projectId)
      .then((details) => privateFs.writeProjectDetails(privatePath, details)
        .then(() => util
          .info(output + ' Network Resources Checked'))
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

function listSSHAbleInstancesByProject(projectId) {
  return getProjectAPI()
    .then((pm) => pm.listSSHAbleInstances(projectId));
}

function listSSHAbleInstances() {
  return clusternatorJson
    .get()
    .then((cJson) => listSSHAbleInstancesByProject(cJson.projectId));
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
  var output = 'Clusternator Initialized With Config: ' +
      clusternatorJson.fullPath(root),
    dDir = options.deploymentsDir,
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
        util.info(output + ' Network Resources *NOT* Checked');
        return;
      }

      return provisionProjectNetwork(projectId, output, options.private)
        .then(initializeSharedKey)
        .then((sharedKey) => makePrivate(sharedKey)
          .then(() => readPrivate(sharedKey))
          .then(privateFs.checksum)
          .then(() => logKey(sharedKey)));
    });
}

function dockerBuild(name, passphrase) {
  return makePrivate(passphrase).then(() => {
    return clusternatorJson
      .findProjectRoot()
      .then((root) => {
        var output, outputError;
        process.chdir(root);
        util.info('Start Docker Build', name);
        return docker.build(name)
          .progress((data) => {
            if (!data) {
              return;
            }
            if (data.error) {
              outputError += data.error;
              util.error(outputError);
            }
            if (data.data) {
              output += data.data;
              util.verbose(output);
            }
          });
      })
      .then(() => {
        util.verbose('Decrypting Private Folder');
        return readPrivate(passphrase);
      })
      .then(() => {
        util.info('Built Docker Image: ', name);
      })
      .fail((err) => {
        util.warn('Docker failed to build: ', err.message);
        return readPrivate(passphrase);
      });
  });
}

function makePrivate(passphrase) {
  return clusternatorJson
    .makePrivate(passphrase)
    .then(() => {
      util.info('Clusternator: Private files/directories encrypted');
    });
}

function readPrivate(passphrase) {
  return clusternatorJson.readPrivate(passphrase).then(() => {
    util.info('Clusternator: Private files/directories un-encrypted');
  });
}

function listProjects() {
  return getProjectAPI()
    .then((pm) => pm
      .listProjects());
}

function describeServices() {
  return getProjectAPI()
    .then((pm) => clusternatorJson
      .get()
      .then((config) => pm
        .describeProject(config.projectId)));
}


/**
 * @param {string} privateKey
 * @param {string} certificate
 * @param {string=} chain
 * @return {Q.Promise}
 */

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

function certList() {
  return getProjectAPI()
    .then((pm) => pm.iam
      .listServerCertificates());
}

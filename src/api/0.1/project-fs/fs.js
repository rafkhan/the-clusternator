'use strict';
const UTF8 = 'utf8';

const path = require('path');
const fs = require('fs');

const Q = require('q');
const cmn = require('../common');

const deploymentsFs = require('./deployments');
const scriptsFs = require('./clusternator-scripts');
const dockerFs = require('./docker');

const constants = cmn.src('constants');
const clusternatorJson = cmn.src('clusternator-json');

const read = Q.nbind(fs.readFile, fs);
const write = Q.nbind(fs.writeFile, fs);
const chmod = Q.nbind(fs.chmod, fs);

module.exports = {
  getProjectRootRejectIfClusternatorJsonExists,
  installExecutable,
  loadCertificateFiles,
  getSkeleton: getSkeletonFile,
  getSkeletonPath: getSkeletonPath,
  mkdirp: Q.nfbind(require('mkdirp')),
  read,
  write,
  chmod,
  path,
  initProject
};

/**
 * @returns {string}
 */
function getSkeletonPath() {
  return path.join(__dirname, '..', '..', '..', '..', 'src', 'skeletons');
}

/**
 * @param {string} skeleton
 * @return {Promise<string>}
 */
function getSkeletonFile(skeleton) {
  return read(path.join(getSkeletonPath(), skeleton) , UTF8);
}

/**
 * @param {string} destFilePath
 * @param {*} fileContents
 * @param {string=} perms
 * @returns {Q.Promise}
 */
function installExecutable(destFilePath, fileContents, perms) {
  perms = perms || '700';
  return write(destFilePath, fileContents).then(() => {
    return chmod(destFilePath, perms);
  });
}

/**
 * @param {string} privateKey
 * @param {string} certificate
 * @param {string=} chain
 * @return {Q.Promise}
 */
function loadCertificateFiles(privateKey, certificate, chain) {
  var filePromises = [
    read(privateKey, UTF8),
    read(certificate, UTF8)
  ];
  if (chain) {
    filePromises.push(read(chain, UTF8));
  }
  return Q
    .all(filePromises)
    .then((results) => {
      return {
        privateKey: results[0],
        certificate: results[1],
        chain: results[2] || ''
      };
    });
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
    });
}


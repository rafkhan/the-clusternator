'use strict';
/**
 * This module encapsulates file system commands relating to Docker, and
 * Dockerfiles
 *
 * @module api/'0.1'/projectFs/docker
 */
const DOCKERFILE = 'Dockerfile';
const DOCKERFILE_NODE_LATEST = 'Dockerfile-node-latest';
const DOCKERFILE_STATIC_LATEST = 'dockerfile-nginx-latest';
const CLUSTERNATOR_DIR = /\$CLUSTERNATOR_DIR/g;

const fs = require('./projectFs');
const privateFs = require('./private');

const cmn = require('../common');

const docker = cmn.src('cli-wrappers', 'docker');
const util = cmn.src('util');
const constants = cmn.src('constants');

module.exports = {
  init: initializeDockerFile,
  build: dockerBuild
};

/**
 *
 * @param {string} clustDir
 * @param {string} dockerType
 * @returns {Q.Promise}
 */
function initializeDockerFile(clustDir, dockerType) {
  /** @todo do not overwrite existing Dockerfile */
  const template = dockerType === 'static' ?
    DOCKERFILE_STATIC_LATEST : DOCKERFILE_NODE_LATEST;
  return fs
    .findProjectRoot()
    .then((root) => fs.getSkeleton(template)
      .then((contents) => {
        contents = contents.replace(CLUSTERNATOR_DIR, clustDir);
        return fs.write(fs.path.join(root, DOCKERFILE), contents);
      }) );
}

/**
 * @param name
 * @param passphrase
 * @returns {Request|*|Promise.<T>}
 */
function dockerBuild(name, passphrase) {
  return privateFs.makePrivate(passphrase).then(() => {
    return fs
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
        return privateFs.readPrivate(passphrase);
      })
      .then(() => {
        util.info('Built Docker Image: ', name);
      })
      .fail((err) => {
        util.warn('Docker failed to build: ', err.message);
        return privateFs.readPrivate(passphrase);
      });
  });
}


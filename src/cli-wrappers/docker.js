'use strict';
/**
 * This module provides promise based shortcuts to the `docker` command
 *
 * @module childProcess/docker
 */

const COMMAND = 'docker';
const FLAG_BUILD = 'build';
const FLAG_FILE = '-f';
const FLAG_TAG = '-t';
const FLAG_PUSH = 'push';
const FLAG_RMI = 'rmi';
const DEFAULT_DOCKERFILE = 'Dockerfile';
const BUILD_CWD = './';

let cproc = require('./child-process');

module.exports = {
  build,
  push,
  destroy
};

/**
 * @param {string} tag
 * @param {string=} dockerFile
 * @returns {Q.Promise}
 */
function build(tag, dockerFile) {
  if (!tag) {
    throw new TypeError('docker: build requires a tag string');
  }
  dockerFile = dockerFile || DEFAULT_DOCKERFILE;
  return cproc.stream(COMMAND, [
    FLAG_BUILD, FLAG_TAG, tag, FLAG_FILE, dockerFile, BUILD_CWD
  ], {
    env: process.env
  });
}

/**
 * @param {string} tag
 * @returns {Q.Promise}
 */
function push(tag) {
  if (!tag) {
    throw new TypeError('docker: push requires a tag string');
  }
  return cproc.stream(COMMAND, [FLAG_PUSH, tag]);
}

/**
 * @param {string} tag
 * @returns {Q.Promise}
 */
function destroy(tag) {
  if (!tag) {
    throw new TypeError('docker: destroy requires a tag string');
  }
  return cproc.output(COMMAND, [FLAG_RMI, tag]);
}

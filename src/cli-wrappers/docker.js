'use strict';

const COMMAND = 'docker',
  FLAG_BUILD = 'build',
  FLAG_FILE = '-f',
  FLAG_TAG = '-t',
  FLAG_PUSH = 'push',
  FLAG_RMI = 'rmi',
  DEFAULT_DOCKERFILE = 'Dockerfile',
  BUILD_CWD = './';

var cproc = require('./child-process');

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

'use strict';
const DOCKERFILE = 'Dockerfile';
const DOCKERFILE_NODE_LATEST = 'Dockerfile-node-14.04-4.2.3';
const DOCKERFILE_STATIC_LATEST = 'dockerfile-nginx-latest';
const CLUSTERNATOR_DIR = /\$CLUSTERNATOR_DIR/g;

const fs = require('./fs');

const cmn = require('../common');

const util = cmn.src('util');
const constants = cmn.src('constants');
const clusternatorJson = cmn.src('clusternator-json');

module.exports = {
  init: initializeDockerFile
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
  return clusternatorJson
    .findProjectRoot()
    .then((root) => fs.getSkeleton(template)
      .then((contents) => {
        contents = contents.replace(CLUSTERNATOR_DIR, clustDir);
        return fs.write(fs.path.join(root, DOCKERFILE), contents);
      }) );
}

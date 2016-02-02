'use strict';
/**
 * This module manages dealing with CircleCI files, specifically adding
 clusternator commands to them

 * @module api/'0.1'/projectFs/circleCi
 */

const CLUSTERNATOR_DIR = /\$CLUSTERNATOR_DIR/g;
const UTF8 = 'utf8';
const CIRCLEFILE = 'circle.yml';

const merge = require('deepmerge');
const Q = require('q');
const YAML = require('yamljs');

const fs = require('./projectFs');

module.exports = {
  loadExistingCircleCIFile,
  initializeCircleCIFile,
  init
};

/**
 * @param {string} fullPath
 * @param {function(...):string=} filter
 * @returns {Q.Promise<Object>}
 */
function loadCircleCIFile(fullPath, filter) {
  return fs.read(fullPath, UTF8)
    .then((contents) => {
      if (typeof filter === 'function') {
        contents = filter(contents);
      }
      return YAML.parse(contents);
    })
    .fail(() => {
      return {};
    });
}

/**
 * @param {string} root
 * @returns {Q.Promise}
 */
function loadExistingCircleCIFile(root) {
  return loadCircleCIFile(fs.path.join(root, CIRCLEFILE));
}

/**
 * @return {Q.Promise<string>}
 */
function getCircleSkeleton(clustDir) {
  return loadCircleCIFile(fs.path.join(fs.getSkeletonPath(), CIRCLEFILE),
    (f) => f
      .replace(CLUSTERNATOR_DIR, clustDir));
}

/**
 * @param {string} root
 * @param {string} clustDir
 * @returns {Q.Promise<string>}
 */
function initializeCircleCIFile(root, clustDir) {
  return Q
    .all([
      getCircleSkeleton(clustDir),
      loadExistingCircleCIFile(root) ])
    .then((results) => YAML
      .stringify(merge(results[0], results[1]), 5));
}

/**
 * @param {string} root
 * @param {string} clustDir
 * @returns {Q.Promise}
 */
function init(root, clustDir) {
  return initializeCircleCIFile(root, clustDir)
    .then((text) => fs.write(fs.path.join(root, CIRCLEFILE), text));
}

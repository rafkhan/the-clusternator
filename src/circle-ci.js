'use strict';

const CLUSTERNATOR_DIR = /\$CLUSTERNATOR_DIR/g;
const UTF8 = 'utf8';

const merge = require('deepmerge');
const Q = require('q');
const fs = require('fs');
const path = require('path');
const CIRCLEFILE = 'circle.yml';
const YAML = require('yamljs');
const writeFile = Q.nbind(fs.writeFile, fs);
const readFile = Q.nbind(fs.readFile, fs);

module.exports = {
  loadExistingCircleCIFile,
  initializeCircleCIFile,
  init
};

/**
 * @return {string}
 */
function getSkeletonPath() {
  return path.join(__dirname, '..', 'src', 'skeletons');
}

/**
 * @param {string} fullPath
 * @param {function(...):string=} filter
 * @returns {Q.Promise<Object>}
 */
function loadCircleCIFile(fullPath, filter) {
  return readFile(fullPath, UTF8)
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
  return loadCircleCIFile(path.join(root, CIRCLEFILE));
}

/**
 * @return {Q.Promise<string>}
 */
function getCircleSkeleton(clustDir) {
  return loadCircleCIFile(path.join(getSkeletonPath(), CIRCLEFILE), (f) => f
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
    .then((text) => writeFile(path.join(root, CIRCLEFILE), text));
}

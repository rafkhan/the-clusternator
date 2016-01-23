'use strict';

const path = require('path');
const fs = require('fs');

const Q = require('q');

const read = Q.nbind(fs.readFile, fs);

module.exports = {
  read,
  write: Q.nbind(fs.writeFile, fs),
  chmod: Q.nbind(fs.chmod, fs),
  getSkeleton: getSkeletonFile,
  getSkeletonPath: getSkeletonPath,
  mkdirp: Q.nfbind(require('mkdirp')),
  path
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
  return read(path.join(getSkeletonPath(), skeleton) , 'utf8');
}

'use strict';

const path = require('path');
const fs = require('fs');

const Q = require('q');

const read = Q.nbind(fs.readFile, fs);
const write = Q.nbind(fs.writeFile, fs);
const chmod = Q.nbind(fs.chmod, fs);

module.exports = {
  installExecutable,
  getSkeleton: getSkeletonFile,
  getSkeletonPath: getSkeletonPath,
  mkdirp: Q.nfbind(require('mkdirp')),
  read,
  write,
  chmod,
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

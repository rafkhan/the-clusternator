'use strict';

const CLUSTERNATOR_PASS = /\$CLUSTERNATOR_PASS/g;

const path = require('path');
const fs = require('fs');
const Q = require('q');

const writeFile = Q.nbind(fs.writeFile, fs);
const readFile = Q.nbind(fs.readFile, fs);
const chmod = Q.nbind(fs.chmod, fs);

module.exports = {
  install
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
  return readFile(path.join(getSkeletonPath(), skeleton) , 'utf8');
}

/**
 * @param {string} destFilePath
 * @param {string} fileContents
 * @param {string=} perms
 * @returns {Q.Promise}
 */
function installExecutable(destFilePath, fileContents, perms) {
  perms = perms || '700';
  return writeFile(destFilePath, fileContents).then(() => {
    return chmod(destFilePath, perms);
  });
}

/**
 * @param {string} root
 * @param {string} name
 * @param {string} passphrase
 * @returns {Q.Promise.<string>}
 */
function install(root, name, passphrase) {
  return getSkeletonFile('git-' + name)
    .then((contents) => {
      contents = contents.replace(CLUSTERNATOR_PASS, passphrase);
      return installExecutable(
        path.join(root, '.git', 'hooks', name), contents, 300);
    });
}

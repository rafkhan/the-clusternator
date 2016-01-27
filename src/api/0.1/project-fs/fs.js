'use strict';
const UTF8 = 'utf8';
const VCS_DIR = '.git';

const path = require('path');
const fs = require('fs');

const Q = require('q');
const cmn = require('../common');

const constants = cmn.src('constants');

const read = Q.nbind(fs.readFile, fs);
const write = Q.nbind(fs.writeFile, fs);
const chmod = Q.nbind(fs.chmod, fs);
const ls = Q.nbind(fs.readdir, fs);
const unlink = Q.nbind(fs.unlink, fs);

module.exports = {
  findProjectRoot,
  installExecutable,
  loadCertificateFiles,
  getSkeleton: getSkeletonFile,
  getSkeletonPath: getSkeletonPath,
  mkdirp: Q.nfbind(require('mkdirp')),
  read,
  write,
  chmod,
  ls,
  unlink,
  path,
  helpers: {
    parent
  }
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
 * This function searches (upwards) for a directory with a .git folder, starting
 * from the CWD!
 * @return {Q.Promise<string>} promise to return the full path of the project
 */
function findProjectRoot(cwd) {
  cwd = cwd || process.cwd();

  var d = Q.defer();

  ls(cwd).then((files) => {
    var index = files.indexOf(VCS_DIR), parentPath;
    if (index === -1) {
      parentPath = parent(cwd);
      if (!parentPath) {
        d.reject(new Error('Clusternator: No Version Control Folder Found'));
        return;
      }
      return findProjectRoot(parentPath).then(d.resolve, d.reject);
    } else {
      process.chdir(cwd);
      d.resolve(cwd);
    }
  }, d.reject);

  return d.promise;
}

/**
 * @param {string} somePath
 * @returns {string}
 */
function parent(somePath) {
  var splits = somePath.split(path.sep).filter(identity),
    root = somePath[0] === path.sep ? path.sep : '';
  if (splits.length === 1) {
    return null;
  }
  splits.pop();
  return root + splits.join(path.sep);
}

function identity(obj) {
  return obj;
}

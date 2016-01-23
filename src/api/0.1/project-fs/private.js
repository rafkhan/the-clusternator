'use strict';

const PRIVATE_CHECKSUM = '.private-checksum';

const Q = require('q');
const path = require('path');
const fs = require('fs');
const cmn = require('../common');
const shaDir = cmn.src('cli-wrappers', 'generate-private-sha');
const util = cmn.src('/util');
const clusternatorJson = cmn.src('clusternator-json');

const mkdirp = Q.nfbind(require('mkdirp'));

const writeFile = Q.nbind(fs.writeFile, fs);
const readFile = Q.nbind(fs.readFile, fs);

module.exports = {
  checksum: privateChecksum,
  diff: privateDiff
};


/**
 * @returns {Q.Promise}
 */
function privateChecksum() {
  return getPrivateChecksumPaths()
    .then((paths) => {
      return mkdirp(paths.clusternator).then(() => paths);
    }).then((paths) => {
      process.chdir(paths.root);
      return paths;
    }).then((paths) =>shaDir
      .genSha(paths.priv)
      .then((sha) => writeFile(paths.checksum, sha)
        .then(() => util
          .info(`Generated shasum of ${paths.priv} => ${sha}`))));
}

/**
 * @param {string} sha
 * @returns {Function}
 */
function getPrivateDiffFn(sha) {
  return (storedSha) => {
    if (sha.trim() === storedSha.trim()) {
      process.exit(0);
    }
    util.info(`Diff: ${sha.trim()} vs ${storedSha.trim()}`);
    process.exit(1);
  };
}

function privateDiff() {
  return getPrivateChecksumPaths()
    .then((paths) => shaDir
      .genSha(paths.priv)
      .then((sha) => readFile(paths.checksum, 'utf8')
        .then(getPrivateDiffFn(sha))
        .fail(() => {
          // read file errors are expected
          util.info(`Diff: no checksum to compare against`);
          process.exit(2);
        })))
    .fail((err) => {
      // unexpected error case
      util.error(err);
      process.exit(2);
    });
}

/**
 * @returns {Q.Promise}
 */
function getPrivateChecksumPaths() {
  return Q.all([
      clusternatorJson.get(),
      clusternatorJson.findProjectRoot() ])
    .then((results) => {
      const privatePath = results[0].private,
        checksumPath = path.join(results[1], results[0].clusternatorDir,
          PRIVATE_CHECKSUM);
      return {
        priv: privatePath,
        checksum: checksumPath,
        clusternator: results[0].clusternatorDir,
        root: results[1]
      };
    });
}


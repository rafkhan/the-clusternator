'use strict';
/**
 * This module runs a script that generates a private sha, script can be found
 * in `the-clusternator/bin`
 *
 * @module childProcess/privateSha
 */

const path = require('path');

var cproc = require('./child-process');

const COMMAND = path.join(
  __dirname, '..', '..', 'bin', 'generate-private-sha.sh');

module.exports = {
  genSha
};

/**
 * @param {string} pathToSha
 * @returns {Q.Promise}
 */
function genSha(pathToSha) {
  if (!pathToSha) {
    throw new TypeError('genSha requires a path to generate a SHA from');
  }

  return cproc.output(COMMAND, [pathToSha]);
}


'use strict';
/**
 * This module provides promised based shortcuts to the `npm` command
 *
 * @module childProcess/npm
 */

const COMMAND = 'npm';
const FLAG_INSTALL = 'install';
const FLAG_RUN = 'run';
const FLAG_BUILD = 'build';

const util = require('../util');

var cproc = require('./child-process');

/**
 * @returns {Q.Promise}
 */
function install() {
  return cproc.stream(COMMAND, [FLAG_INSTALL], {
      env: process.env
    });
}

/**
 * @returns {Q.Promise}
 */
function build() {
  return cproc.stream(COMMAND, [FLAG_RUN, FLAG_BUILD], {
      env: process.env
    });
}

module.exports = {
  install,
  build
};

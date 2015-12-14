'use strict';

const COMMAND = 'npm';
const FLAG_INSTALL = 'install';
const FLAG_RUN = 'run';
const FLAG_BUILD = 'build';

var spawn = require('child_process').spawn,
  fs = require('fs'),
  util = require('../util'),
  Q = require('q');

/**
 * @returns {Q.Promise}
 */
function install() {
  var d = Q.defer(),
    npm = spawn(COMMAND, [FLAG_INSTALL], {
      env: process.env
    });

  npm.stdout.setEncoding('utf8');
  npm.stderr.setEncoding('utf8');

  npm.stdout.on('data', (data) => {
    d.notify({ data: data });
  });

  npm.stderr.on('data', (data) => {
    d.notify({ error: data });
  });

  npm.on('close', (code) => {
    if (+code) {
      d.reject(new Error('npm terminated with exit code: ' + code));
    } else {
      util.info('npm install exited cleanly', code);
      d.resolve();
    }
  });

  npm.stdin.end();

  return d.promise;
}

/**
 * @returns {Q.Promise}
 */
function build() {
  var d = Q.defer(),
    npm = spawn(COMMAND, [FLAG_RUN, FLAG_BUILD], {
      env: process.env
    });

  npm.stdout.setEncoding('utf8');
  npm.stderr.setEncoding('utf8');

  npm.stdout.on('data', (data) => {
    d.notify({ data: data });
  });

  npm.stderr.on('data', (data) => {
    d.notify({ error: data });
  });

  npm.on('close', (code) => {
    if (+code) {
      d.reject(new Error('npm terminated with exit code: ' + code));
    } else {
      util.info('npm build exited cleanly', code);
      d.resolve();
    }
  });

  npm.stdin.end();

  return d.promise;
}

module.exports = {
  install,
  build
};

'use strict';

const COMMAND = 'git';
const FLAG_REV_PARSE = 'rev-parse';
const FLAG_HEAD = 'HEAD';
const FLAG_CLONE = 'cone';

var spawn = require('child_process').spawn,
  Q = require('q');

/**
 * @returns {Q.Promise}
 */
function shaHead() {
  var d = Q.defer(),
    git = spawn(COMMAND, [FLAG_REV_PARSE, FLAG_HEAD]),
    error = '',
    output = '';

  git.stdout.on('data', (data) => {
    output += data;
  });

  git.stderr.on('data', (data) => {
    error += data;
  });

  git.on('close', (code) => {
    if (error) {
      d.reject(new Error(error));
    } else if (+code) {
      d.reject(new Error('git terminated with exit code: ' + code));
    } else {
      d.resolve(output.trim());
    }
  });

  git.stdin.end();

  return d.promise;
}

/**
 * @param {string} repo
 * @returns {Q.Promise}
 */
function clone(repo) {
  if (!repo) {
    throw new TypeError('git: clone requires a repository string');
  }
  var d = Q.defer(),
    git = spawn(COMMAND, [FLAG_CLONE, repo]),
    error = '',
    output = '';

  git.stdout.on('data', (data) => {
    output += data;
  });

  git.stderr.on('data', (data) => {
    error += data;
  });

  git.on('close', (code) => {
    if (error) {
      d.reject(new Error(error));
    } else if (+code) {
      d.reject(new Error('git terminated with exit code: ' + code));
    } else {
      d.resolve(output.trim());
    }
  });

  git.stdin.end();

  return d.promise;
}

module.exports = {
  shaHead,
  clone
};
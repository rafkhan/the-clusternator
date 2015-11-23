'use strict';

const COMMAND = 'git';
const FLAG_REV_PARSE = 'rev-parse';
const FLAG_HEAD = 'HEAD';
const FLAG_CLONE = 'cone';
const GITIGNORE = '.gitignore';
const NEWLINE = '\n';
const UTF8 = 'utf8';

var spawn = require('child_process').spawn,
  fs = require('fs'),
  Q = require('q'),
  path = require('path'),
  clusternatorJson = require('../clusternator-json');

var writeFile = Q.nbind(fs.writeFile, fs),
  readFile = Q.nbind(fs.readFile, fs);

/**
 * @returns {Q.Promise<string>}
 */
function gitIgnorePath() {
  return clusternatorJson.findProjectRoot().then((root) => {
    return path.normalize(root + path.sep + GITIGNORE);
  });
}
/**
 * @returns {Q.Promise<string[]>}
 */
function readGitIgnore() {
  return gitIgnorePath().then((ignoreFile) => {
    return readFile(ignoreFile, UTF8).then((file) => {
      return file.split(NEWLINE);
    });
  });
}

/**
 * @param {string} toIgnore
 * @param {string[]} ignores
 * @returns {boolean}
 */
function gitIgnoreHasItem(toIgnore, ignores) {
  var found = false;
  ignores.forEach((str) => {
    if (str.indexOf(toIgnore) === 0) {
      found = true;
    }
  });
  return found;
}

function addToGitIgnore(toIgnore) {
  return readGitIgnore().then((ignores) => {
    var output;
    if (gitIgnoreHasItem(toIgnore, ignores)) {
      // item already exists
      return;
    }
    return gitIgnorePath().then((ignoreFile) => {
      ignores.push(toIgnore);
      output = ignores.join(NEWLINE);
      return writeFile(ignoreFile, output);
    });
  });
}

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
  GITIGNORE,
  shaHead,
  clone,
  addToGitIgnore,
  helpers: {
    gitIgnorePath,
    readGitIgnore,
    gitIgnoreHasItem
  }
};
'use strict';
/**
 * This module deals with installing/removing a project's local git hooks
 *
 * @module api/'0.1'/projectFs/gitHooks
 */

const NEWLINE = '\n';
const SHEBANG = '#!/usr/bin/env bash' + NEWLINE;
const HOOK_FILES = ['post-commit', 'pre-commit', 'post-merge'];
const SHELL_DIR = 'DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"';

const path = require('path');
const Q = require('q');

const fs = require('./project-fs');
const clusternatorJson = require('./clusternator-json');
const cn = require('../js/js-api');

const CN = require('../common').src('constants').CLUSTERNATOR_PREFIX;


module.exports = {
  install,
  remove
};

/**
 * @param {string} root
 * @param {string} hook
 * @return {string}
 */
function hpath(root, hook) {
  return path.join(root, '.git', 'hooks', hook);
}

/**
 * @param {string} hook
 * @returns {string}
 */
function clusternateHook(hook) {
  return `${CN}-${hook}`;
}

/**
 * @param {string} root
 * @param {string} hook
 * @param {string=} perms
 * @return {Q.Promise}
 */
function chmodExec(root, hook, perms) {
  // '500' only user can read/write/execute, nobody reads
  // user needs to be able to read for git to execute
  // write isn't strictly necessary, but it's not writes we're worried about
  perms = perms || '700';
  return fs
    .chmod(hpath(root, hook), perms);
}

/**
 * @param {string} root
 * @param {string} hook
 * @returns {Q.Promise}
 */
function installExecutable(root, hook) {
  return getHookSkeleton(hook)
  .then((text) => writeFile(root, clusternateHook(hook), text)
    .then(() => chmodExec(root, clusternateHook(hook))));
}

/**
 * @param {string} hook
 * @returns {Q.Promise.<string>}
 */
function getHookSkeleton(hook) {
  return fs.getSkeleton('git-' + hook);
}

/**
 * @param {string} root
 * @param {string} fileName
 * @return {Q.Promise<string>}
 */
function readFile(root, fileName) {
  return fs.read(hpath(root, fileName), 'utf8');
}

/**
 * @param {string} root
 * @param {string} fileName
 * @param {string} data
 * @return {Q.Promise}
 */
function writeFile(root, fileName, data) {
  return fs.write(hpath(root, fileName), data);
}

function logChar(char, count) {
  count = count || 80;
  return new Array(count).join(char);
}

/**
 * @param {string} hook
 * @returns {string}
 */
function invokeHookName(hook) {
  return logChar('#') +
    NEWLINE +
    '# Clustnernator Hook.  Please do not delete this.' +
    NEWLINE +
    '# If you wish to remove this hook, please use ' +
    '"clusternator git-hook-remove"' +
    NEWLINE +
    SHELL_DIR +
    NEWLINE +
    `$DIR/${clusternateHook(hook)}` +
    NEWLINE +
    logChar('#');
}

/**
 * @param {string} hookText
 * @param {string} hook
 * @returns {string}
 */
function pruneHookText(hookText, hook) {
  return hookText.replace(invokeHookName(hook), '');
}

/**
 * @param {string} hookText
 * @param {string} hook
 * @returns {string}
 */
function installHookText(hookText, hook) {
  if (hookText) {
    return pruneHookText(hookText, hook) + NEWLINE + NEWLINE +
      invokeHookName(hook) + NEWLINE;
  }
  return SHEBANG + invokeHookName(hook) + NEWLINE;
}

/**
 * @returns {Q.Promise.<T>}
 */
function pruneMasterExecutable(root, hook) {
  return readFile(root, hook)
    .then((hookText) => pruneHookText(hookText, hook))
    .then((newText) => writeFile(root, hook, newText));
}

/**
 * @param {Error} err
 * @throws {Error}
 */
function ignoreFileNotFound(err) {
  // if the master hook doesn't exist, do not worry about it
  if (err.code === 'ENOENT') {
    return;
  }
  throw err;
}


/**
 * @param {string} root
 * @param {string} hook
 * @returns {Q.Promise}
 */
function updateMasterExecutable(root, hook) {
  return readFile(root, hook)
    .fail(ignoreFileNotFound)
    .then((hookText) => installHookText(hookText, hook))
    .then((newText) => writeFile(root, hook, newText))
    // '700' user can read/write/execute.  nobody else can do squat
    .then(() => chmodExec(root, hook, '700'));
}

/**
 * @param {string} root
 * @param {string} hook
 * @return {Q.Promise}
 */
function pruneExecutable(root, hook) {
  return fs.unlink(hpath(root, clusternateHook(hook)))
    // fail silently
    .fail(() => undefined);
}


/**
 * @param {string} root
 * @param {string} hook
 * @returns {Q.Promise}
 */
function pruneHook(root, hook) {
  return Q.all([
    pruneMasterExecutable(root, hook),
    pruneExecutable(root, hook)
  ]);
}

/**
 * @param {string} root
 * @param {string} hook
 * @returns {Q.Promise}
 */
function installHook(root, hook) {
  return Q.all([
    updateMasterExecutable(root, hook),
    installExecutable(root, hook)
  ]);
}

/**
 * @param {string} root
 * @returns {Q.Promise}
 */
function pruneHooks(root) {
  return Q
    .all(HOOK_FILES
      .map((hook) => pruneHook(root, hook)));
}

/**
 * @param {string} root
 */
function installHooks(root) {
  return Q
    .all(HOOK_FILES
      .map((hook) => installHook(root, hook)));
}

function install() {
  return fs.findProjectRoot()
    .then(installHooks);
}


function remove() {
  return fs.findProjectRoot()
    .then(pruneHooks);
}

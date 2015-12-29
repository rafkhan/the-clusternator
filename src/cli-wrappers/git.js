'use strict';

const TMP = require('os').tmpdir();
const COMMAND = 'git';
const FLAG_REV_PARSE = 'rev-parse';
const FLAG_HEAD = 'HEAD';
const FLAG_CLONE = 'clone';
const FLAG_CHECKOUT = 'checkout';
const GITIGNORE = '.gitignore';

const fs = require('fs');
const Q = require('q');
const path = require('path');
const mkdirp = Q.nfbind(require('mkdirp'));
const rimraf = Q.nfbind(require('rimraf'));

var cproc = require('./child-process');
var util = require('../util');

module.exports = {
  GITIGNORE,
  shaHead,
  clone,
  create,
  destroy,
  checkout,
  helpers: {
    checkout,
    getShortRepoName,
    cloneRepoInDir,
    checkoutIdentifierFromDir
  }
};

/**
 * @returns {Q.Promise}
 */
function shaHead() {
  return cproc.output(COMMAND, [FLAG_REV_PARSE, FLAG_HEAD]);
}

/**
 * @param {string} identifier ideally a SHA
 * @returns {Q.Promise}
 */
function checkout(identifier) {
  if (!identifier) {
    throw new TypeError('git: clone requires a repository string');
  }
  return cproc.output(COMMAND, [FLAG_CHECKOUT, identifier]);
}

/**
 * @param {string} repo
 * @returns {Q.Promise}
 */
function clone(repo) {
  if (!repo) {
    throw new TypeError('git: clone requires a repository string');
  }
  return cproc.stream(COMMAND, [FLAG_CLONE, repo]);
}

/**
 * Strips a git URL into a short name (no .git or http://...)
 * @param {string} repo
 * @returns {string}
 */
function getShortRepoName(repo) {
  var split = repo.split('/'),
    lastString = split[split.length - 1];

  return lastString.slice(lastString.length - 4) === '.git' ?
      lastString.slice(0, lastString.length - 4) : lastString;
}

/**
 * @param {string} repo
 * @param {string} dir
 * @param {string=} repoMasked
 * @returns {Q.Promise}
 */
function cloneRepoInDir(repo, dir, repoMasked) {
  repoMasked = repoMasked || repo;
  util.verbose('Git Clone', repoMasked);
  process.chdir(dir);
  return clone(repo);
}

/**
 * @param {string} identifier
 * @param {string} dir
 * @param {string=} repoMasked
 * @returns {Q.Promise}
 */
function checkoutIdentifierFromDir(identifier, dir, repoMasked) {
  process.chdir(dir);
  util.verbose('Git Checkout', repoMasked);
  return checkout(identifier)
    .fail((err) => util
      .warn(`git checkout failed, cloning from master/HEAD: ${err.message}`));
}

/**
 * @param {string} repo
 * @param {string=} identifier (master)
 * @return {Q.Promise<{{ id: string, path: string }}>}
 */
function create(repo, identifier) {
  identifier = identifier || 'master';
  const repoId =
      (+Date.now()).toString(16) + Math.floor(Math.random() * 100000),
    namespacePath = path.normalize(TMP + '/' + repoId),
    repoShort = getShortRepoName(repo),
    repoDesc = {
      id:  repoId,
      path:  path.join(namespacePath, repoShort)
    };
  var repoMasked = repo.split('@').filter((i) => i);
  repoMasked = repoMasked[repoMasked.length - 1];
  util.verbose('Create/Checkout Git Repo', repoMasked);

  return mkdirp(namespacePath)
    .then(() => cloneRepoInDir(repo, namespacePath, repoMasked))
    .then(() => checkoutIdentifierFromDir(identifier, repoDesc.path))
    .then(() => repoDesc )
    .fail((err) => {
      util.verbose('git create failed', err);
      return repoDesc;
    });
}


/**
 * @param {string} repoId
 */
function destroy(repoId) {
  util.info('Destroying Git Repo: ', repoId);
  process.chdir(path.normalize(TMP));
  return rimraf(path.normalize(TMP + '/' + repoId));
}


'use strict';

const TMP = '/tmp';
const COMMAND = 'git';
const FLAG_REV_PARSE = 'rev-parse';
const FLAG_HEAD = 'HEAD';
const FLAG_CLONE = 'clone';
const FLAG_CHECKOUT = 'checkout';
const GITIGNORE = '.gitignore';
const NEWLINE = '\n';
const UTF8 = 'utf8';

var spawn = require('child_process').spawn,
  fs = require('fs'),
  Q = require('q'),
  path = require('path'),
  mkdirp = Q.nfbind(require('mkdirp')),
  rimraf = Q.nfbind(require('rimraf')),
  util = require('../util'),
  clusternatorJson = require('../clusternator-json');

var writeFile = Q.nbind(fs.writeFile, fs),
  readFile = Q.nbind(fs.readFile, fs);

/**
 * @returns {Q.Promise<string>}
 */
function gitIgnorePath() {
  return clusternatorJson.findProjectRoot().then((root) => {
    return path.join(root, GITIGNORE);
  });
}
/**
 * @returns {Q.Promise<string[]>}
 */
function readGitIgnore() {
  return gitIgnorePath().then((ignoreFile) => {
    return readFile(ignoreFile, UTF8).then((file) => {
      return file.split(NEWLINE);
    }, () => {
      // fail over
      return [];
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
  if (!Array.isArray(toIgnore)) {
    toIgnore = [toIgnore];
  }
  return readGitIgnore().then((ignores) => {
    var output;
    var newIgnores = toIgnore.filter((item) => {
      return ignores.indexOf(item) === -1;
    });

    if (!newIgnores.length) {
      // items already exists
      return;
    }
    return gitIgnorePath().then((ignoreFile) => {
      ignores = ignores.concat(newIgnores);
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
 * @param {string} identifier ideally a SHA
 * @returns {Q.Promise}
 */
function checkout(identifier) {
  if (!identifier) {
    throw new TypeError('git: clone requires a repository string');
  }
  var d = Q.defer(),
    git = spawn(COMMAND, [FLAG_CHECKOUT, identifier]);

  git.stdout.setEncoding('utf8');

  git.stdout.on('data', (data) => {
    d.notify({ data: data });
  });

  git.stderr.on('data', (data) => {
    d.notify({ error: data });
  });

  git.on('close', (code) => {
    if (+code) {
      d.reject(new Error('git terminated with exit code: ' + code));
    } else {
      d.resolve();
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
    git = spawn(COMMAND, [FLAG_CLONE, repo]);

  git.stdout.setEncoding('utf8');

  git.stdout.on('data', (data) => {
    d.notify({ data: data });
  });

  git.stderr.on('data', (data) => {
    d.notify({ error: data });
  });

  git.on('close', (code) => {
    if (+code) {
      d.reject(new Error('git terminated with exit code: ' + code));
    } else {
      d.resolve();
    }
  });

  git.stdin.end();

  return d.promise;
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
      lastString.slice(0, lastString.length - 4) : lastString
}

/**
 * @param {string} repo
 * @param {string=} identifier (master)
 * @return {Q.Promise<{{ id: string, path: string }}>}
 */
function create(repo, identifier) {
  identifier = identifier || 'master';
  const repoId = (+Date.now()).toString(16) + Math.floor(Math.random() * 100000),
    namespacePath = path.normalize(TMP + '/' + repoId),
    repoShort = getShortRepoName(repo),
    repoDesc = {
      id:  repoId,
      path:  path.join(namespacePath, repoShort)
    };
  var repoMasked = repo.split('@').filter((i) => i);
  repoMasked = repoMasked[repoMasked.length - 1];
  util.verbose('Create/Checkout Git Repo', repoMasked);
  return mkdirp(namespacePath).then(() => {
    util.info('Git Clone', repoMasked);
    process.chdir(namespacePath);
    return clone(repo);
  }).then(() => {
    process.chdir(repoDesc.path);
    util.info('Git Checkout', repoMasked);
    return checkout(identifier).fail((err) => {
      util.warn('git checkout failed, cloning from master/HEAD: ', err.message);
    });
  }).then(() => {
    return repoDesc;
  }).fail((err) => {
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

module.exports = {
  GITIGNORE,
  shaHead,
  clone,
  addToGitIgnore,
  create,
  destroy,
  helpers: {
    gitIgnorePath,
    readGitIgnore,
    gitIgnoreHasItem,
    checkout
  }
};
'use strict';

/** @todo make VCS_DIR configurable */
const VCS_DIR = '.git';
const GIT_EXTENSION = '.git';
const GIT_ORIGIN = 'remote "origin"';
const URL_SEP = '/';
const PACKAGE_JSON = 'package.json';
const BOWER_JSON = 'bower.json';
const FILENAME = 'clusternator.json';
const UTF8 = 'utf8';
const CLUSTERNATOR_TAR = 'clusternator.tar.gz';
const CLUSTERNATOR_PRIVATE = CLUSTERNATOR_TAR + '.asc';
const SKELETON = {
  projectId: 'new-project',
  appDefs: {
    pr: 'path/to/your/prAppDef'
  }
};

var Q = require('q'),
  git = Q.nfbind(require('parse-git-config')),
  path = require('path'),
  fs = require('fs'),
  inquirer = require('inquirer'),
  util = require('./util'),
  questions = require('./create-interactive-questions'),
  gpg = require('./cli-wrappers/gpg'),
  tar = require('./cli-wrappers/tar'),
  rimraf = Q.nfbind(require('rimraf'));

const GIT_CONFIG = VCS_DIR + path.sep + 'config';

var ls = Q.nbind(fs.readdir, fs),
  readFile = Q.nbind(fs.readFile, fs),
  writeFile = Q.nbind(fs.writeFile, fs);

function identity(obj) {
  return obj;
}

/**
 * @param {string} dirPath directory of project root
 * @returns {string}
 */
function fullPath(dirPath) {
  return path.normalize(dirPath + path.sep + FILENAME);
}

function parent(somePath) {
  var splits = somePath.split(path.sep).filter(identity),
    root = somePath[0] === path.sep ? path.sep : '';
  if (splits.length === 1) {
    return null;
  }
  splits.pop();
  return root + splits.join(path.sep);
}

/**
 * This function searches (upwards) for a directory with a .git folder, starting from the CWD!
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
 * @param {string} url
 * @returns {string}
 */
function parseGitUrl(url) {
  var splits = url.split(URL_SEP).filter(identity),
    result = splits[splits.length -1],
    index = result.indexOf(GIT_EXTENSION);

  if (index === result.length - GIT_EXTENSION.length) {
    return result.slice(0, index);
  }
  return result;
}

function findGitName(projectRoot) {
  return git({ cwd: projectRoot, path: GIT_CONFIG }).then((config) => {
    if (!config || !config[GIT_ORIGIN] || !config[GIT_ORIGIN].url) {
      throw new Error('Unexpected Git Config');
    }
    return parseGitUrl(config[GIT_ORIGIN].url);
  });
}

/**
 * @param {string} projectRoot
 * @returns {string}
 */
function findPackageName(projectRoot) {
  try {
    return require(path.normalize(projectRoot + path.sep + PACKAGE_JSON)).name;
  } catch(err) {
    return '';
  }
}

/**
 * @param {string} projectRoot
 * @return {string}
 */
function findBowerName(projectRoot) {
  try {
    return require(path.normalize(projectRoot + path.sep + BOWER_JSON)).name;
  } catch(err) {
    return '';
  }
}

/**
 * @param {string[]} strings
 * @returns {Array}
 */
function deDupe(strings) {
  var newCollection = [];
  strings.forEach((str) => {
    if (!str) {
      return;
    }
    if (newCollection.indexOf(str) === -1) {
      newCollection.push(str);
    }
  });
  return newCollection;
}

/**
 * @param {string} projectRoot
 * @returns {Q.Promise<string[]>}
 */
function findProjectNames(projectRoot) {
  var names = [
    findBowerName(projectRoot),
    findPackageName(projectRoot)
  ];

  return findGitName(projectRoot).then((name) => {
    names.unshift(name);
    return deDupe(names);
  }, () => {
    return deDupe(names);
  });
}


function validate(cJson) {
  const C = 'culsternator.json requires ';

  var hasFailed = false,
    results = {};

  if (!cJson.projectId) {
    hasFailed = true;
    results.projectId = C + 'projectId';
  }
  if (!cJson.appDefs) {
    hasFailed = true;
    results.projectId = C + 'an appDefs object';
  } else {
    if (!cJson.appDefs.pr) {
      hasFailed = true;
      results.projectId = C + 'an appDefs.pr object, or pointer (string)';
    }
  }
  if (hasFailed) {
    return results;
  }
  results.ok = true;
  return results;
}

/**
 * @param {Object=} params
 * @returns {Q.Promise<Array>}
 */
function createInteractive(params) {
  var d = Q.defer(),
    mandatory = questions.mandatory(params),
    pq = questions.privateChoice();

  inquirer.prompt(mandatory, (answers) => {
    inquirer.prompt(pq, (pAnswer) => {
      if (pAnswer.private) {
        answers.private = [pAnswer.private];
      }
      d.resolve(answers);
    });
  });

  return d.promise;
}

/**
 * Rejects if the file exists, resolves otherwise
 * @param {string} dir
 * @returns {Q.Promise}
 */
function skipIfExists(dir) {
  dir = fullPath(dir);
  var d = Q.defer();
  readFile(dir).then(() => {
    d.reject(new Error(dir + ' already exists.'));
  }, () => {
    d.resolve();
  });
  return d.promise;
}

/**
 * Resolves if the
 * @returns {Q.Promise}
 */
function privateExists() {
  return findProjectRoot().then((root) => {
    var dir = path.normalize(root + path.sep + CLUSTERNATOR_PRIVATE);
    return readFile(dir).then(() => {
      return dir;
    }, (err) => {
      util.plog('Clusternator: Encrypted Private File: ' + dir + ' does not exist, or is unreadable');
      throw err;
    });
  });
}

/**
 * @param {Object} answers
 * @return {string}
 */
function answersToClusternatorJSON(answers) {
  answers.private = answers.private || [];

  return JSON.stringify({
    projectId: answers.projectId,
    private: answers.private,
    appDefs: {
      pr: answers.appDefPr
    }
  }, null, 2);
}

/**
 * @param {Object} fullAnswers
 * @return {Q.Promise}
 */
function writeFromFullAnswers(fullAnswers) {
  var json = answersToClusternatorJSON(fullAnswers.answers),
    dir = fullPath(fullAnswers.projectDir);
  return writeFile(dir, json, UTF8);
}

/**
 * @return {Q.Promise<Object>}
 */
function getConfig() {
  return findProjectRoot().then((root) => {
    var file = fullPath(root);
    return readFile(file, UTF8).then((file) => {
      return JSON.parse(file);
    });
  });
}

/**
 * @param {string} passPhrase
 * @returns {Q.Promise}
 */
function readPrivate(passPhrase) {
  return privateExists().then(() => {
    return findProjectRoot().then((root) => {
      var gpgPath = path.normalize(root + path.sep + CLUSTERNATOR_PRIVATE),
        tarPath = path.normalize(root + path.sep + CLUSTERNATOR_TAR);
      return gpg.decryptFile(passPhrase, gpgPath, tarPath).then(() => {
        return tar.extract(tarPath).then(() => {
          return Q.allSettled([
            rimraf(gpgPath),
            rimraf(tarPath)
          ]);
        });
      });
    });
  });
}


/**
 * Given a passphase make private tars, and encrypts a config's private section
 * @param {String} passPhrase
 * @returns {Q.Promise}
 */
function makePrivate(passPhrase) {
  return getConfig().then((config) => {
    if (!config.private || !(Array.isArray(config.private) || !config.private.length)) {
      throw new Error('Clusternator: No private assets marked in config file');
    }
    return findProjectRoot().then((root) => {
      var tarFile = path.normalize(root + path.sep + CLUSTERNATOR_TAR);

      return tar.ball(tarFile, config.private).then(() => {
        return gpg.encryptFile(passPhrase, tarFile)
      }).then(() => {
        var rmPromises = config.private.map((fileOrFolder) => {
          return rimraf(path.normalize(root + path.sep + fileOrFolder));
        });
        rmPromises.push(rimraf(tarFile));
        return Q.allSettled(rmPromises);
      });
    });
  });
}

module.exports = {
  createInteractive,
  skipIfExists,
  findProjectNames,
  findProjectRoot,
  fullPath,
  get: getConfig,
  privateExists,
  readPrivate,
  makePrivate,
  validate,
  writeFromFullAnswers,
  FILENAME,
  CLUSTERNATOR_PRIVATE,
  helpers: {
    parent,
    parseGitUrl,
    findGitName,
    findPackageName,
    findBowerName,
    deDupe,
    answersToClusternatorJSON
  }
};
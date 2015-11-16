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
  questions = require('./create-interactive-questions');

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
    mandatory = questions.mandatory(params);

  inquirer.prompt(mandatory, (answers) => {
    d.resolve(answers);
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
  readFile(dir).then((file) => {
    console.log('this shoudl fail', file);
    d.reject(new Error(dir + ' already exists.'));
  }, () => {
    d.resolve();
  });
  return d.promise;
}

/**
 * @param {Object} answers
 * @return {string}
 */
function answersToClusternatorJSON(answers) {
  return JSON.stringify({
    projectId: answers.projectId,
    appDefs: {
      pr: answers.appDefPr
    }
  });
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


module.exports = {
  createInteractive,
  skipIfExists,
  findProjectNames,
  findProjectRoot,
  fullPath,
  validate,
  writeFromFullAnswers,
  FILENAME,
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
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
const SKELETON = require('./skeletons/clusternator-json-skeleton');
const RX_NEWLINE = /\r?\n/;
const NEWLINE = '\r\n';
const DEFAULT_PORT_INTERNAL_NODE = 3000;
const DEFAULT_PORT_INTERNAL_STATIC = 80;
const DEFAULT_PORT_EXTERNAL = 80;

const Q = require('q');
const path = require('path');
const fs = require('fs');
const rimraf = Q.nfbind(require('rimraf'));

var git = Q.nfbind(require('parse-git-config'));
var util = require('./util');
var questions = require('./skeletons/create-interactive-questions');
var gpg = require('./cli-wrappers/gpg');
var tar = require('./cli-wrappers/tar');

const GIT_CONFIG = VCS_DIR + path.sep + 'config';

const ls = Q.nbind(fs.readdir, fs);
const readFile = Q.nbind(fs.readFile, fs);
const writeFile = Q.nbind(fs.writeFile, fs);

function identity(obj) {
  return obj;
}

/**
 * @param {string} dirPath directory of project root
 * @returns {string}
 */
function fullPath(dirPath) {
  return path.join(dirPath, FILENAME);
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
 * This function searches (upwards) for a directory with a .git folder, starting
 * from the CWD!
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
    return require(path.join(projectRoot, PACKAGE_JSON)).name;
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
    return require(path.join(projectRoot, BOWER_JSON)).name;
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
 * @param {Object} mainAnswers
 * @param {Object} portAnswers
 * @returns {boolean}
 */
function addPortAnswer(mainAnswers, portAnswers) {
  if (!mainAnswers.ports) {
    mainAnswers.ports = [];
  }
  const arePortsValid = mainAnswers.ports.reduce((prev, curr) => {
    if (prev === false) {
      return false;
    }
    if (portAnswers.portInternal === curr.portInternal) {
      return false;
    }
    if (portAnswers.portExternal === curr.portExternal) {
      return false;
    }
    return true;
  }, true);
  if (!arePortsValid) {
    return false;
  }
  mainAnswers.ports.push({
    portInternal: portAnswers.portInternal,
    portExternal: portAnswers.portExternal,
    protocol: portAnswers.protocol
  });
  return true;
}

function getDefaultPorts(answers, skipDefaults) {
  if (skipDefaults) {
    return { portInternal: '', portExternal: '' };
  }
  if (answers.backend === 'node') {
    return {
      portExternal: DEFAULT_PORT_EXTERNAL,
      portInternal: DEFAULT_PORT_INTERNAL_NODE
    };
  }
  return {
    portExternal: DEFAULT_PORT_EXTERNAL,
    portInternal: DEFAULT_PORT_INTERNAL_STATIC
  };
}

function promptPorts(answers, skipDefaults) {
  const ports = questions.projectPorts(getDefaultPorts(answers, skipDefaults));
  return util
    .inquirerPrompt(ports)
    .then((portAnswers) => {
      if (!addPortAnswer(answers, portAnswers)) {
        util.warn(`${portAnswers.portInternal}:${portAnswers.portExternal} ` +
        ` was not added.  The internal, or external port is already in mapped`);
      }
      if (portAnswers.moar) {
        return promptPorts(answers, true);
      }
      return answers;
    });
}

/**
 * @param {Object=} params
 * @returns {Q.Promise<Array>}
 */
function createInteractive(params) {
  const init = questions.projectInit(params);

  return util
    .inquirerPrompt(init)
    .then(promptPorts)
    .then((answers) => {
      if (answers.passphraseInput === 'gen') {
        // generate
        return gpg
          .generatePass()
          .then((pass) => {
            answers.passphrase = pass;
            return answers;
          });
      }
      return answers;
    });
}

/**
 * Rejects if the file exists, resolves otherwise
 * @param {string} dir
 * @returns {Q.Promise}
 */
function skipIfExists(dir) {
  dir = fullPath(dir);
  return readFile(dir)
    .then(() => {
    throw new Error(dir + ' already exists.');
  }, () => {
      return;
  });
}

/**
 * @param {string} root
 * @returns {Q.Promise}
 * @private
 */
function privateExists_(root) {
  var dir = path.join(root, CLUSTERNATOR_PRIVATE);
  return readFile(dir).then(() => {
    return dir;
  }, (err) => {
    util.info(`Clusternator: Encrypted Private File: ${dir} does not exist, or
    is unreadable`);
    throw err;
  });
}

/**
 * Resolves if the
 * @returns {Q.Promise}
 */
function privateExists() {
  return findProjectRoot()
    .then((root) => {
      return privateExists_(root);
  });
}

/**
 * @param {Object} answers
 * @return {string}
 */
function answersToClusternatorJSON(answers) {
  answers.private = answers.private || [];

  var config = util.clone(SKELETON);

  config.projectId = answers.projectId;
  config.private = answers.private;
  config.deploymentsDir = answers.deploymentsDir;

  return JSON.stringify(config, null, 2);
}

/**
 * @param {Object} fullAnswers
 * @return {Q.Promise}
 */
function writeFromFullAnswers(fullAnswers) {
  var json = answersToClusternatorJSON(fullAnswers.answers),
    dir = fullPath(fullAnswers.projectDir);
  return writeFile(dir, json, UTF8).then(() => {
    return fullAnswers;
  });
}

function getConfigFrom(root) {
  var file = fullPath(root);
  return readFile(file, UTF8).then((file) => {
    return JSON.parse(file);
  });
}

/**
 * @return {Q.Promise<Object>}
 */
function getConfig() {
  return findProjectRoot()
    .then(getConfigFrom);
}

/**
 * @param {string} tarPath
 * @returns {Q.Promise}
 */
function untar(tarPath) {
  return tar
    .extract(tarPath)
    .then(() => rimraf(tarPath));
}

/**
 * @param {string} passPhrase
 * @param {string} root=
 * @returns {Q.Promise}
 */
function readPrivate(passPhrase, root) {
  if (!root) {
    return findProjectRoot()
      .then(readPrivateFromRoot);
  } else {
    return readPrivateFromRoot(root);
  }

  function readPrivateFromRoot(root) {
    return privateExists_(root)
      .then(() => {
        var gpgPath = path.join(root, CLUSTERNATOR_PRIVATE),
          tarPath = path.join(root, CLUSTERNATOR_TAR);

        return gpg
          .decryptFile(passPhrase, gpgPath, tarPath)
          .then(() => untar(tarPath));
      });
  }
}

/**
 * Given a passphase make private tars, and encrypts a config's private section
 * @param {String} passPhrase
 * @returns {Q.Promise}
 */
function makePrivate(passPhrase, root) {
  return getConfig()
    .then((config) => {
      if (!config.private) {
        throw new Error(
          'Clusternator: No private assets marked in config file');
      }

      function makePrivateFromRoot(root) {
        var tarFile = path.join(root, CLUSTERNATOR_TAR);

        return tar
          .ball(tarFile, config.private)
          .then(() => gpg
            .encryptFile(passPhrase, tarFile))
          .then(() => Q
            .allSettled(
              [config.private]
                .concat([rimraf(tarFile)])));
      }

      if (root) {
        return makePrivateFromRoot(root);
      }
      return findProjectRoot()
        .then(makePrivateFromRoot);
    });
}

/**
 * @param {string} ignoreFileName
 * @returns {Q.Promise<string>}
 */
function ignorePath(ignoreFileName) {
  return findProjectRoot()
    .then((root) => path.join(root, ignoreFileName));
}


/**
 * @param {string} file
 * @returns {string[]}
 */
function splitIgnoreFile(file) {
  return file.split(RX_NEWLINE);
}

/**
 * @param {string} file
 * @return {Q.Promise<string[]>}
 */
function readAndSplitIgnore(file) {
  return readFile(file, UTF8)
    .then(splitIgnoreFile)
    .fail(() => []);
}

/**
 * @param {string} ignoreFileName
 * @param {boolean=} isFullPath defaults to false
 * @returns {Q.Promise<string[]>}
 */
function readIgnoreFile(ignoreFileName, isFullPath) {
  if (isFullPath) {
    return readAndSplitIgnore(ignoreFileName);
  }
  return ignorePath(ignoreFileName)
    .then(readAndSplitIgnore);
}

/**
 * @param {string} toIgnore
 * @param {string[]} ignores
 * @returns {boolean}
 */
function ignoreHasItem(toIgnore, ignores) {
  var found = false;
  ignores.forEach((str) => {
    if (str.indexOf(toIgnore) === 0) {
      found = true;
    }
  });
  return found;
}

/**
 * @param {string} ignoreFileName
 * @param {string|string[]} toIgnore
 * @returns {Request|Promise.<T>|*}
 */
function addToIgnore(ignoreFileName, toIgnore) {
  if (!Array.isArray(toIgnore)) {
    toIgnore = [toIgnore];
  }
  return ignorePath(ignoreFileName)
    .then((path) => readFile(path, UTF8)
      .fail(() => '')) // not all starters might have ignore file, fail over
    .then((rawIgnore) => {
      const ignores = splitIgnoreFile(rawIgnore);
      const newIgnores = toIgnore
        .filter((item) => ignores.indexOf(item) === -1);

      if (!newIgnores.length) {
        // items already exists
        return;
      }

      return ignorePath(ignoreFileName)
        .then((ignoreOutputFile) => {
          const output = NEWLINE + rawIgnore + NEWLINE +
            newIgnores.join(NEWLINE) + NEWLINE;
          return writeFile(ignoreOutputFile, output);
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
  getFrom: getConfigFrom,
  privateExists,
  readPrivate,
  makePrivate,
  validate,
  writeFromFullAnswers,
  addToIgnore,
  readIgnoreFile,
  FILENAME,
  CLUSTERNATOR_PRIVATE,
  helpers: {
    parent,
    parseGitUrl,
    findGitName,
    findPackageName,
    findBowerName,
    deDupe,
    answersToClusternatorJSON,
    ignorePath,
    readIgnoreFile,
    ignoreHasItem,
  }
};

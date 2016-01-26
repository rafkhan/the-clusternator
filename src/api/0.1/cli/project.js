'use strict';

const DOCKER_IGNORE = '.dockerignore';
const GIT_IGNORE = '.gitignore';
const NPM_IGNORE = '.npmignore';

const Q = require('q');

const fs = require('../project-fs/fs');
const initProject = require('../project-fs/init');

const privateFs = require('../project-fs/private');
const cn = require('../js/js-api');
const gitHooks = require('../project-fs/git-hooks');
const cmn = require('../common');

const Config = cmn.src('config');
const util = cmn.src('util');
const clusternatorJson = require('../project-fs/clusternator-json');

module.exports = {
  init
};

class ClusternatedError extends Error {}

/**
 * @param {Object} answers
 * @returns {Q.Promise}
 */
function processInitUserOptions(answers) {
  // parse results
  return clusternatorJson
    .writeFromAnswers(answers)
    .then(() => Q.all([
      addPrivateToGitIgnore(answers.private),
      addPrivateToNpmIgnore(answers.private),
      addPrivateToDockerIgnore(answers.private)
    ]).then(() => answers));
}

/**
 * @param {string} privatePath
 * @returns {Q.Promise}
 */
function addPrivateToGitIgnore(privatePath) {
  return privateFs.addToIgnore(GIT_IGNORE, privatePath);
}

/**
 * @param {string} privatePath
 * @returns {Q.Promise}
 */
function addPrivateToNpmIgnore(privatePath) {
  return privateFs.addToIgnore(NPM_IGNORE, privatePath);
}

/**
 * @param {string} privatePath
 * @returns {Q.Promise}
 */
function addPrivateToDockerIgnore(privatePath) {
  return privateFs.addToIgnore(DOCKER_IGNORE, privatePath);
}

function initProjectDb(answers) {
  return cn
    .createProjectData(answers.projectId)
    .then((results) => Q.all([
        encrypDecrypt(results.sharedKey),
        privateFs.writeClusternatorCreds(answers.private, results.authToken) ])
      .then(() => results));
}

function encrypDecrypt(sharedKey) {
  return privateFs.makePrivate(sharedKey)
    .then(() => privateFs.readPrivate(sharedKey))
    .then(privateFs.checksum);
}

function initFs(answers, doOffline) {
  return initProject(answers.root, answers, doOffline)
    .then(() => answers);
}

function logLoop(someChar, val) {
  val = parseInt(val, 10) >= 0 ? parseInt(val, 10) : 80;
  console.log(new Array(val).join(someChar));
}

function logInitComplete(dbResults) {
  logLoop('-');
  console.log('Project Init Complete');
  logLoop('-');
  console.log('GitHub Key:');
  console.log(dbResults.gitHubKey);
  logLoop('-');
  console.log('Shared Key:');
  console.log(dbResults.sharedKey);
  logLoop('-');
}

/**
 * @param {boolean=} doOffline
 * @returns {Q.Promise}
 */
function initStage2(doOffline) {
  return getInitUserOptions()
    .then((answers) => initFs(answers, doOffline))
    .then((answers) => initProjectDb(answers)
      .then((dbResults) => cn
        .provisionProjectNetwork(answers.projectId)
        .then((details) => privateFs
          .writeProjectDetails(answers.private, details))
        .then(() => processGitHooks(answers, answers.root, dbResults.sharedKey))
        .then(() => logInitComplete(dbResults))))
    .fail((err) => {
      if (err instanceof ClusternatedError) {
        util.info('Project is already clusternated (clusternator.json exists)');
        return;
      }
      util.info('Clusternator: Initialization Error: ' + err.message);
      util.info(err.stack);
    });
}

/**
 * @param {boolean} doOffline
 * @returns {Q.Promise}
 */
function init(doOffline) {
  if (Config().user) {
    return initStage2(doOffline);
  } else {
    return Config
      .interactiveUser()
      .then(() => initStage2(doOffline));
  }
}

/**
 * @param {Object} params
 * @returns {Object}
 */
function applyUserConfig(params) {
  const c = Config();
  if (!c.user) {
    return params;
  }
  params.tld = c.user.tld || '';
  return params;
}

function failOnExists() {
  throw new ClusternatedError();
}

/**
 * @returns {Q.Promise<Object>}
 */
function getInitUserOptions() {
  return clusternatorJson
    .getProjectRootRejectIfClusternatorJsonExists()
    .fail(failOnExists)
    .then((root) =>clusternatorJson
      .findProjectNames(root)
      .then(pickBestName)
      .then(applyUserConfig)
      .then(clusternatorJson.createInteractive)
      .then((answers) => {
        answers.root = root;
        return processInitUserOptions(answers);
      }));
}

/**
 * @param {Object} answers
 * @param {string} root
 * @param {string} passphrase
 * @returns {Q.Promise}
 */
function processGitHooks(answers, root, passphrase) {
  if (!answers.gitHooks) {
    return Q.resolve();
  }
  return Q.all([
    gitHooks.install(root, 'post-commit', passphrase),
    gitHooks.install(root, 'pre-commit', passphrase),
    gitHooks.install(root, 'post-merge', passphrase)
  ]).then(() => {
    util.info('Git Hooks Installed');
  });
}

/**
 * @param {string[]} names
 * @returns {{name: string}}
 */
function pickBestName(names) {
  return {
    name: names[0]
  };
}


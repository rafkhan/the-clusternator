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
 * @param {Object} results
 * @param {string} root - the project's root folder
 * @returns {Q.Promise}
 */
function processInitUserOptions(results, root) {
  // parse results
  return clusternatorJson
    .writeFromFullAnswers({
      projectDir: root,
      answers: results
    })
    .then((fullAnswers) => Q.all([
      addPrivateToGitIgnore(fullAnswers),
      addPrivateToNpmIgnore(fullAnswers),
      addPrivateToDockerIgnore(fullAnswers)
    ]).then(() => {
      return {
        root,
        fullAnswers
      };
    }));
}

/**
 * @param {Object} fullAnswers
 * @returns {Q.Promise}
 */
function addPrivateToGitIgnore(fullAnswers) {
  return privateFs.addToIgnore(GIT_IGNORE, fullAnswers.answers.private);
}

/**
 * @param {Object} fullAnswers
 * @returns {Q.Promise}
 */
function addPrivateToNpmIgnore(fullAnswers) {
  return privateFs.addToIgnore(NPM_IGNORE, fullAnswers.answers.private);
}

/**
 * @param {Object} fullAnswers
 * @returns {Q.Promise}
 */
function addPrivateToDockerIgnore(fullAnswers) {
  return privateFs.addToIgnore(DOCKER_IGNORE, fullAnswers.answers.private);
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

function initFs(initDetails, doOffline) {
  return initProject(initDetails.root,
    initDetails.fullAnswers.answers, doOffline)
    .then(() => initDetails.fullAnswers.answers);
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
  console.log(dbResults.gitHubkey);
  logLoop('-');
  console.log('Shared Key:');
  console.log(dbResults.sharedkey);
  logLoop('-');
}

/**
 * @param {boolean=} doOffline
 * @returns {Q.Promise}
 */
function initStage2(doOffline) {
  return getInitUserOptions()
    .then((initDetails) => initFs(initDetails, doOffline))
    .then((answers) => initProjectDb(answers)
      .then((dbResults) => cn
        .provisionProjectNetwork(answers.projectId)
        .then((details) => privateFs
          .writeProjectDetails(answers.private, details))
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
      .then((results) => Q
        .all([
          processInitUserOptions(results, root),
          processGitHooks(results, root)])
        .then((results) => results[0])));
}

function processGitHooks(results, root) {
  if (!results.passphrase) {
    return;
  }
  if (!results.gitHooks) {
    return;
  }
  return Q.all([
    gitHooks.install(root, 'post-commit', results.passphrase),
    gitHooks.install(root, 'pre-commit', results.passphrase),
    gitHooks.install(root, 'post-merge', results.passphrase)
  ]).then(() => {
    util.info('Git Hooks Installed');
    util.info('Shared Secret: ', results.passphrase);
    util.info('Do not lose the shared secret, and please keep it safe');
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


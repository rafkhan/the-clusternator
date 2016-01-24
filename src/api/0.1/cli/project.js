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

/**
 * @param {boolean=} doOffline
 * @returns {Q.Promise}
 */
function initStage2(doOffline) {
  return getInitUserOptions()
    .then((initDetails) => initProject(
      initDetails.root, initDetails.fullAnswers.answers, doOffline)
      .then(() => cn
        .provisionProjectNetwork(initDetails.fullAnswers.answers.projectId)
        .then((details) => privateFs
          .writeProjectDetails(initDetails.fullAnswers.answers.private, details)
          .then((token) => privateFs
            .writeClusternatorCreds(initDetails.fullAnswers.answers.private,
              details.ghToken))))
      .then(cn.initializeSharedKey)
      .then((sharedKey) => privateFs.makePrivate(sharedKey)
        .then(() => privateFs.readPrivate(sharedKey))
        .then(privateFs.checksum)
        .then(() => logKey(sharedKey))))
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

/**
 * @param {string} sharedKey
 */
function logKey(sharedKey) {
  console.log('');
  console.log('Share this *SECRET* key with your team members');
  console.log('Also use it as CLUSTERNATOR_SHARED_KEY on CircleCi');
  console.log(`CLUSTERNATOR_SHARED_KEY ${sharedKey}`);
  console.log('');
}


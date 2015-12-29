'use strict';

const DOCKER_IGNORE = '.dockerignore';
const GIT_IGNORE = '.gitignore';
const NPM_IGNORE = '.npmignore';

const Q = require('q');

const cn = require('../js/js-api');
const cmn = require('../common');

var util = cmn.src('util');
var clusternatorJson = cmn.src('clusternator-json');

module.exports = {
  init
};


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
  return cn.addPrivateToIgnore(GIT_IGNORE, fullAnswers.answers.private);
}

/**
 * @param {Object} fullAnswers
 * @returns {Q.Promise}
 */
function addPrivateToNpmIgnore(fullAnswers) {
  return cn.addPrivateToIgnore(NPM_IGNORE, fullAnswers.answers.private);
}

/**
 * @param {Object} fullAnswers
 * @returns {Q.Promise}
 */
function addPrivateToDockerIgnore(fullAnswers) {
  return cn.addPrivateToIgnore(DOCKER_IGNORE, fullAnswers.answers.private);
}

/**
 * @param {boolean} doOffline
 * @returns {Q.Promise}
 */
function init(doOffline) {
  return getInitUserOptions()
    .then((initDetails) => cn
      .initProject(
        initDetails.root, initDetails.fullAnswers.answers, doOffline))
    .fail((err) => {
      util.info('Clusternator: Initialization Error: ' + err.message);
      util.info(err.stack);
    });
}


/**
 * @returns {Q.Promise<Object>}
 */
function getInitUserOptions() {
  return cn
    .getProjectRootRejectIfClusternatorJsonExists()
    .then((root) =>clusternatorJson
      .findProjectNames(root)
      .then(pickBestName)
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
    cn.installGitHook(root, 'post-commit', results.passphrase),
    cn.installGitHook(root, 'pre-commit', results.passphrase),
    cn.installGitHook(root, 'post-merge', results.passphrase)
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

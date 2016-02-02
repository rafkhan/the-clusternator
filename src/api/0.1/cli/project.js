'use strict';
/**
 * This module is a middleware that sits between {@link module:api/'0.1'/cli}
 and {@link module:api/'0.1'/clusternator} as well as the relevant cloudService
 API.

 This module largely deals with prompting the user for info on how to build a
 project
 * @module api/'0.1'/cli/project
 */

const NOT_AUTHENTICATED = 401;
const DOCKER_IGNORE = '.dockerignore';
const GIT_IGNORE = '.gitignore';
const NPM_IGNORE = '.npmignore';

const Q = require('q');

const userCLI = require('./user');

const fs = require('../project-fs/projectFs');
const initProject = require('../project-fs/init');

const privateFs = require('../project-fs/private');
const cn = require('../js/js-api');
const gitHooks = require('../project-fs/git-hooks');
const clusternatorJson = require('../project-fs/clusternator-json');
const cmn = require('../common');

const Config = cmn.src('config');
const util = cmn.src('util');

module.exports = {
  init
};

class ClusternatedError extends Error {
  constructor(message) {
    super(message);
  }
}

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
        privateFs.writeClusternatorCreds(results.authToken, answers.private) ])
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
        .then(gitHooks.install)
        .then(() => logInitComplete(dbResults))))
    .fail((err) => {
      if (err instanceof ClusternatedError) {
        util.info('Project is already clusternated (clusternator.json exists)');
        return;
      }
      if (+err.code === NOT_AUTHENTICATED) {
        throw err;
      }
      util.info('Clusternator: Initialization Error: ' + err.message);
      util.info(err.stack);
    });
}

/**
 * @param {boolean=} doOffline
 * @returns {Promise}
 */
function configUserLoginAndInit(doOffline) {
  return userCLI
    .checkConfiguredAndLoggedIn()
    .then(() => initStage2(doOffline));
}

/**
 * @param {boolean=} doOffline
 * @param {{ credentials: { user: string } }} user
 * @returns {Promise}
 */
function loginAndInit(doOffline, user) {
  console.log('');
  console.log('No access token stored locally.  Please login');
  return userCLI
      .login(user.credentials.user)
      .then(() => initStage2(doOffline));
}

/**
 * @param {boolean} doOffline
 * @returns {Q.Promise}
 */
function init(doOffline) {
  const user = Config().user;
  if (user && user.credentials && user.credentials.token ) {
    return initStage2(doOffline)
      .fail((err) => {
        if (+err.code === NOT_AUTHENTICATED) {
          console.log('');
          console.log('Invalid credentials found, please login');
          console.log('');
          return userCLI
            .login()
            .then(() => initStage2(doOffline));
        }
      });
  } else if (user && user.credentials) {
    return loginAndInit(doOffline, user);
  } else {
    return configUserLoginAndInit(doOffline);
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
 * @param {string[]} names
 * @returns {{name: string}}
 */
function pickBestName(names) {
  return {
    name: names[0]
  };
}


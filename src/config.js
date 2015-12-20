'use strict';
/**
This file loads AWS credentials, and configuration for the server, or possibly
a "local server".
*/

const AWS_ENV_KEY = 'AWS_ACCESS_KEY_ID';
const AWS_ENV_SECRET = 'AWS_SECRET_ACCESS_KEY';

const util = require('./util'),
  Q = require('Q'),
  fs = require('fs'),
  path = require('path'),
  semver = require('semver'),
  questions = require('./skeletons/create-interactive-questions');

const DOT_CLUSTERNATOR_CONFIG =
  path.join(getUserHome(), '.clusternator_config.json'),
  writeFile = Q.nbind(fs.writeFile, fs),
  chmod = Q.nbind(fs.chmod, fs);

var credFileName = 'credentials',
  configFileName = 'config',
  localPath = path.join(__dirname, '..', '.private'),
  globalPath = '/etc/clusternator/';

/**
 * @todo replace this with `os.homedir()`?
 * https://nodejs.org/api/os.html#os_os_homedir
 * @returns {string}
 */
function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function validateAwsCreds(c) {
  if (!c) {
    return null;
  }
  if (!c.accessKeyId) {
    return null;
  }
  if (!c.secretAccessKey) {
    return null;
  }
  if (!c.region) {
    return null;
  }
  return c;
}

function loadJSON(fullpath) {
  try {
    return require(fullpath);
  } catch (err) {
    util.winston.debug('Error', err.message);
    return null;
  }
}

function getAwsCredsFromProc() {
  if (process.env[AWS_ENV_KEY] && process.env[AWS_ENV_SECRET]) {
    return {
      accessKeyId: process.env[AWS_ENV_KEY],
      secretAccessKey: process.env[AWS_ENV_SECRET],
    }
  }
  return null;
}

function checkAwsCreds() {
  var fullpath = path.join(localPath, credFileName + '.local.json'),
    c = validateAwsCreds(loadJSON(fullpath));
  if (c) {
    return c;
  }
  util.verbose('No "local" credentials found in ' + fullpath +
    ', checking project');
  fullpath = localPath + credFileName + '.json';
  c = validateAwsCreds(loadJSON(fullpath));
  if (c) {
    return c;
  }
  util.verbose('No "project" credentials found in ' + fullpath +
    ', checking global');
  fullpath = path.join(globalPath, credFileName + '.json');
  c = validateAwsCreds(loadJSON(fullpath));
  if (c) {
    return c;
  }
  util.verbose('No "global" credentials found in ' + fullpath +
    ', checking environment variables');
  return getAwsCredsFromProc();
}

function validateUserConfig(c) {
  if (!c.credentials) {
    return null;
  }
  if (!c.credentials.host) {
    return null;
  }
  if (!c.credentials.user) {
    return null;
  }
  if (!c.credentials.token) {
    return null;
  }
  if (!c.apiVersion) {
    c.apiVersion = '0.0.1';
  } else {
    c.apiVersion = semver.clean(c.apiVersion);
  }
  return c;
}

function checkUser() {
  try {
    var c = require(DOT_CLUSTERNATOR_CONFIG);
    return validateUserConfig(c);
  } catch (err) {
    return null;
  }
}

function checkConfig() {
  var fullpath = path.join(localPath, configFileName + '.local.json'),
    c = loadJSON(fullpath);
  if (c) {
    return c;
  }
  util.verbose('No "local" config found in ' + fullpath +
    ', checking project');
  fullpath = localPath + configFileName + '.json';
  c = loadJSON(fullpath);
  if (c) {
    return c;
  }
  util.verbose('No "project" config found in ' + fullpath +
    ', checking global');
  fullpath = path.join(globalPath, configFileName + '.json');
  c = loadJSON(fullpath);
  if (c) {
    return c;
  }
  util.verbose('No "global" config found in ' + fullpath);
  return {};
}

function getConfig() {
  var config = checkConfig();

  config.awsCredentials = checkAwsCreds();
  config.user = checkUser();

  return config;
}

/**
 * @param {{ host: string, username: string, token: string, name: string=,
 email: string= }} options
 * @return {Q.Promise}
 */
function writeUserConfig(options) {
  if (!options) {
    throw new TypeError('User config requires a parameters object');
  }
  if (!options.host || !options.username || !options.token) {
    throw new TypeError('User config requires a host/user/token');
  }
  return writeFile(DOT_CLUSTERNATOR_CONFIG, JSON.stringify({
    name: options.name || 'Mysterious Stranger',
    email: options.email || '',
    credentials: {
      user: options.username,
      token: options.token,
      host: options.host
    }
  }, null, 2))
    .then(() => chmod(DOT_CLUSTERNATOR_CONFIG, '600'));
}

function maskString(str) {
  if (!str) { return ''; }
  return 'XXXXXXXXXXXXXXXXXXXXXXXXXXXX' + str.slice(str.length - 5);
}

function interactiveUser() {
  var user = getConfig().user;
  if (!user) {
    user = { credentials: {} };
  }
  return util
    .inquirerPrompt(questions.userInit({
      name: user.name || 'Mysterious Stranger',
      email: user.email || '',
      host: user.credentials.host || '',
      username: user.credentials.user || '',
      token: maskString(user.credentials.token) || ''
  }))
  .then(writeUserConfig);
}

getConfig.interactiveUser = interactiveUser;
module.exports = getConfig;

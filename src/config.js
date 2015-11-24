'use strict';
/**
This file loads AWS credentials, and configuration for the server, or possibly
a "local server".
*/

const AWS_ENV_KEY = 'AWS_ACCESS_KEY_ID';
const AWS_ENV_SECRET = 'AWS_SECRET_ACCESS_KEY';

var util = require('./util'),
  path = require('path'),
  semver = require('semver');

const DOT_CLUSTERNATOR_CONFIG =
  path.normalize(getUserHome() + path.sep + '.clusternator_config.json');

var credFileName = 'credentials',
  configFileName = 'config',
  localPath = path.join(__dirname, '/../'),
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
    console.log('Error', err.message);
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
  util.plog('No "local" credentials found in ' + fullpath +
    ', checking project');
  fullpath = localPath + credFileName + '.json';
  c = validateAwsCreds(loadJSON(fullpath));
  if (c) {
    return c;
  }
  util.plog('No "project" credentials found in ' + fullpath +
    ', checking global');
  fullpath = path.join(globalPath, credFileName + '.json');
  c = validateAwsCreds(loadJSON(fullpath));
  if (c) {
    return c;
  }
  util.plog('No "global" credentials found in ' + fullpath +
    ', checking environment variables');
  return getAwsCredsFromProc();
}

function validateClusternatorCreds(c) {
  if (!c.host) {
    return null;
  }
  if (!c.user) {
    return null;
  }
  if (!c.pass) {
    return null;
  }
  if (!c.apiVersion) {
    c.apiVersion = '0.0.1';
  } else {
    c.apiVersion = semver.clean(c.apiVersion);
  }
  return c;
}

function checkClusternatorCreds() {
  try {
    var c = require(DOT_CLUSTERNATOR_CONFIG);
    return validateClusternatorCreds(c);
  } catch (err) {
    return {
      user: null,
      pass: null,
      host: null,
      apiVersion: null
    };
  }
}

function checkConfig() {
  var fullpath = path.join(localPath, configFileName + '.local.json'),
    c = loadJSON(fullpath);
  if (c) {
    return c;
  }
  util.plog('No "local" config found in ' + fullpath +
    ', checking project');
  fullpath = localPath + configFileName + '.json';
  c = loadJSON(fullpath);
  if (c) {
    return c;
  }
  util.plog('No "project" config found in ' + fullpath +
    ', checking global');
  fullpath = path.join(globalPath, configFileName + '.json');
  c = loadJSON(fullpath);
  if (c) {
    return c;
  }
  util.plog('No "global" config found in ' + fullpath);
  return {};
}

function getConfig() {
  var config = checkConfig();

  config.awsCredentials = checkAwsCreds();
  config.clusternatorCredentials = checkClusternatorCreds();

  return config;
}

module.exports = getConfig;

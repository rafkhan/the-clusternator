'use strict';
/**
This file loads AWS credentials, and configuration for the server, or possibly
a "local server".
*/

const AWS_ENV_KEY = 'AWS_ACCESS_KEY_ID';
const AWS_ENV_SECRET = 'AWS_SECRET_ACCESS_KEY';

var util = require('./util'),
  path = require('path');

var credFileName = 'credentials',
  configFileName = 'config',
  localPath = path.join(__dirname, '/../'),
  globalPath = '/etc/clusternator/';


function validateCreds(c) {
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

function getCredsFromProc() {
  if (process.env[AWS_ENV_KEY] && process.env[AWS_ENV_SECRET]) {
    return {
      accessKeyId: process.env[AWS_ENV_KEY],
      secretAccessKey: process.env[AWS_ENV_SECRET],
    }
  }
  return null;
}

function checkCreds() {
  var fullpath = path.join(localPath, credFileName + '.local.json'),
    c = validateCreds(loadJSON(fullpath));
  if (c) {
    return c;
  }
  util.plog('No "local" credentials found in ' + fullpath +
    ', checking project');
  fullpath = localPath + credFileName + '.json';
  c = validateCreds(loadJSON(fullpath));
  if (c) {
    return c;
  }
  util.plog('No "project" credentials found in ' + fullpath +
    ', checking global');
  fullpath = path.join(globalPath, credFileName + '.json');
  c = validateCreds(loadJSON(fullpath));
  if (c) {
    return c;
  }
  util.plog('No "global" credentials found in ' + fullpath +
    ', checking environment variables');
  return getCredsFromProc();
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
  var creds = checkCreds(),
    config = checkConfig();

  if (!creds) {
    throw new Error('Clusternator requires configuration');
  }

  config.credentials = creds;

  return config;
}

module.exports = getConfig;

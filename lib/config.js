'use strict';

/** @todo even though we're moving away from environment variables we _should_
check to see if they're present, _after_ the global check */

var util = require('./util'),
    path = require('path');

var fileName = 'credentials',
    localPath = path.join(__dirname, '/../'),
    globalPath = '/etc/clusternator/';

function validateCreds(c) {
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

function loadCreds(fullpath) {
  try {
    return validateCreds(require(fullpath));
  } catch (err) {
    console.log('Error', err.message);
    return null;
  }
}

function checkCreds() {
  var fullpath = path.join(localPath, fileName + '.local.json'),
      c = loadCreds(fullpath);
  if (c) {
    return c;
  }
  util.plog('No "local" credentials found in ' + fullpath + ', checking project');
  fullpath = localPath + fileName + '.json';
  c = loadCreds(fullpath);
  if (c) {
    return c;
  }
  util.plog('No "project" credentials found in ' + fullpath + ', checking global');
  fullpath = path.join(globalPath, fileName + '.json');
  c = loadCreds(fullpath);
  util.plog('No "global" credentials found in ', fullpath);
}

function init() {
  var creds = checkCreds();

  if (!creds) {
    throw new Error('Clusternator requires configuration');
  }

  module.exports.credentials = creds;
}

module.exports = {
  init: init
};
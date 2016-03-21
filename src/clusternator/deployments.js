'use strict';
/**
 * Clusternator REST API's CLI deployments interface
 *
 * @module clusternator/projectManager
 */

const Q = require('q');
const constants = require('../constants');
const makePostRequest = require('./common').makePostRequest;

module.exports = {
  create,
  destroy,
  update
};

function create(project, name, appDef, sshKeys, force) {

  // TODO implement force
  
  return makePostRequest('/deployment/create', {
    appDef: appDef,
    sshKeys: sshKeys,
    deployment: name,
    repo: project
  });
}

function destroy(project, name) {
  return makePostRequest('/deployment/destroy', {
    deployment: name,
    repo: project
  });
}

function update() {}

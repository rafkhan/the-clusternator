'use strict';
/**
 * This module encapsulates function that initialize a project's file system
 *
 * @module api/'0.1'/projectFs/init
 */
const Q = require('q');

const deploymentsFs = require('./deployments');
const scriptsFs = require('./clusternator-scripts');
const dockerFs = require('./docker');

const cmn = require('../common');
const util = cmn.src('util');

module.exports = initProject;

/**
 * @param {string} root
 * @param {{ deploymentsDir: string, clusternatorDir: string,
 projectId: string, backend: string, tld: string, circleCi: boolean,
 gitHubOwner: string }} options
 * @param skipNetwork
 * @returns {Request|Promise.<T>|*}
 */
function initProject(root, options, skipNetwork) {
  const dDir = options.deploymentsDir;
  const cDir = options.clusternatorDir;
  const projectId = options.projectId;
  const dockerType = options.backend;

  return Q
    .all([
      deploymentsFs.init(dDir, projectId, options.ports),
      scriptsFs.init(cDir, options.tld),
      scriptsFs.initOptional(options, root),
      dockerFs.init(cDir, dockerType)])
    .then(() => {
      if (skipNetwork) {
        util.info('Network Resources *NOT* Checked');
      }
    });
}

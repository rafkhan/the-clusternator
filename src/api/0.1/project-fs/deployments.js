'use strict';
/**
 * This module has functions relating to managing deployment files
 *
 * @module api/'0.1'/projectFs/deployments
 */

const Q = require('q');
const fs = require('./project-fs');
const cmn = require('../common');
const appDefSkeleton = require('./skeletons/app-def');

const util = cmn.src('util');
const constants = cmn.src('constants');
const clusternatorJson = require('./clusternator-json');

module.exports = {
  init: initializeDeployments,
  generateDeploymentFromName
};

/**
 * @param {string} name
 * @param {string} dDir
 * @param {Object} appDef
 */
function writeDeployment(name, dDir, appDef) {
  return fs.write(fs.path.join(dDir, name + '.json'), appDef);
}

/**
 * @param {string} name
 * @param {Array} ports
 * @returns {Request|*|Promise.<T>}
 */
function generateDeploymentFromName(name, ports) {
  util.info('Generating deployment: ',  name);
  return clusternatorJson.get().then((config) => {
    let appDef = util.clone(appDefSkeleton);
    appDef.name = config.projectId;
    if (ports) {
      addPortsToAppDef(ports, appDef);
    }
    appDef = JSON.stringify(appDef, null, 2);
    return writeDeployment(name, config.deploymentsDir, appDef);
  });
}

/**
 * @param {string} depDir
 * @param {string} projectId
 * @param {Object[]} ports
 * @returns {Q.Promise}
 */
function initializeDeployments(depDir, projectId, ports) {
  return fs.mkdirp(depDir).then(() => {
    let prAppDef = util.clone(appDefSkeleton);
    prAppDef.name = projectId;
    addPortsToAppDef(ports, prAppDef);
    prAppDef = JSON.stringify(prAppDef, null, 2);

    return Q.all([
      fs.mkdirp(fs.path.join(depDir, '..', constants.SSH_PUBLIC_PATH)),
      fs.write(fs.path.join(depDir, 'pr.json'), prAppDef),
      fs.write(fs.path.join(depDir, 'master.json'), prAppDef)
    ]);
  });
}

/**
 * @param {Array} ports
 * @param {Object} appDef
 */
function addPortsToAppDef(ports, appDef) {
  ports.forEach((port) => {
    appDef.tasks[0].containerDefinitions[0].portMappings.push({
      hostPort: port.portExternal,
      containerPort: port.portInternal,
      protocol: port.protocol
    });
  });
}


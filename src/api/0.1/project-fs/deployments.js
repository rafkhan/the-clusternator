'use strict';

const Q = require('q');
const path = require('path');
const fs = require('fs');
const mkdirp = Q.nfbind(require('mkdirp'));
const cmn = require('../common');

const util = cmn.src('util');
const constants = cmn.src('constants');
const appDefSkeleton = cmn.src('skeletons', 'app-def');
const clusternatorJson = cmn.src('clusternator-json');

const writeFile = Q.nbind(fs.writeFile, fs);

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
  return writeFile(path.join(dDir, name + '.json'), appDef);
}

/**
 * @param {string} name
 * @param {Array} ports
 * @returns {Request|*|Promise.<T>}
 */
function generateDeploymentFromName(name, ports) {
  util.info('Generating deployment: ',  name);
  return clusternatorJson.get().then((config) => {
    var appDef = util.clone(appDefSkeleton);
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
  return mkdirp(depDir).then(() => {
    var prAppDef = util.clone(appDefSkeleton);
    prAppDef.name = projectId;
    addPortsToAppDef(ports, prAppDef);
    prAppDef = JSON.stringify(prAppDef, null, 2);

    return Q.allSettled([
      mkdirp(path.join(depDir, '..', constants.SSH_PUBLIC_PATH)),
      writeFile(path.join(depDir, 'pr.json'), prAppDef),
      writeFile(path.join(depDir, 'master.json'), prAppDef)
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


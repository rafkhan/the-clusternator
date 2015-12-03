'use strict';

var aws = require('../../aws/project-init'),
  Q = require('q');

function noopP() {
  return Q.resolve(true);
}

function getCommands(config) {
  return aws(config).then((a) => {
    return {
      project: {
        create: a.create,
        list: noopP,
        describe: noopP,
        destroy: a.destroy
      },
      pr: {
        create: a.createPR,
        list: noopP,
        describe: noopP,
        destroy: a.destroyPR
      },
      deployment: {
        create: a.createDeployment,
        list: noopP,
        describe: noopP,
        destroy: a.destroyDeployment
      }
    };
  });
}

module.exports = getCommands;
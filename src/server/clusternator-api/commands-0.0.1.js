'use strict';

var aws = require('../../aws/project-init'),
  dockernate = require('../../dockernate'),
  slack = require('../../cli-wrappers/slack'),
  Q = require('q');

function noopP() {
  return Q.resolve(true);
}

/**
 * @param {Array} params
 * @returns {Q.Promise}
 */
function projectBuild(params) {
  var  d = Q.defer(),
    imageName = 'rafkhan/delete-me-i-am-from-docker-in-a-vm';

  dockernate
    .create('https://github.com/bennett000/js-seed-full-stack.git',
      imageName)
    .then(() => {
      return slack.message(`Built New Image: ${imageName}`,
        'the-clusternator');
    }).fail((err) => {
    return slack.message(`Build Image ${imageName} failed, Error:
              ${err}`, 'the-clusternator');
  });

  d.resolve();
  return d.promise;
}

function getCommands(config) {
  return aws(config).then((a) => {
    return {
      projects: {
        create: a.create,
        list: a.listProjects,
        describe: noopP,
        destroy: a.destroy,
        build: projectBuild
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
'use strict';

const  Q = require('q'),
  git = require('./cli-wrappers/git'),
  docker = require('./cli-wrappers/docker'),
  util = require('./util');

function pfail(msg, id) {
  return (err) => {
    util.warn('Dockernator Failed To ' + msg, err.message);
    return git.destroy(id);
  };
}

/**
 *
 * @param {string} repo repository path/URI
 * @param {string} image name of docker image
 * @param {string=} tag SHA git tag, or actual git tag
 * @param {string=} dockerFile
 * @returns {Q.Promise<string>} the image name
 */
function create(repo, image, tag, dockerFile) {
  if (!repo || !image) {
    return Q.reject(
      new TypeError('Dockernator create requires repo, image'));
  }
  util.info('Creating new Docker build', repo, image, tag)
  return git
    .create(repo, tag)
    .then((repoDesc) => {
      util.verbose('CWD -> ', repoDesc.path);
      process.chdir(repoDesc.path);
      util.info('Building Docker Image: ', image, `(${repo})`, tag);
      return docker.build(image, dockerFile)
        .then(() => {
          util.info('Pushing Docker Image: ', image, `(${repo})`, tag);
          return docker.push(image).fail(pfail('push', repoDesc.id));
        })
        .fail(pfail('build', repoDesc.id))
        .then(() => {
          return git.destroy(repoDesc);
        })
        .fail(pfail('cleanup git', repoDesc.id));
    })
    .then(() => {
      return image;
    })
}

module.exports = {
  create
};
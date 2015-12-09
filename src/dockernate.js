'use strict';

const  Q = require('q'),
  git = require('./cli-wrappers/git'),
  docker = require('./cli-wrappers/docker'),
  util = require('./util');

function pfail(msg, id) {
  return (err) => {
    util.warn('Dockernator Failed To ' + msg, err.message);
    return git.destroy(id).then(() => {
      util.info('Dockernation Failed: Cleanup Successful');
      throw err;
    });
  };
}

function dockerBuild(repo, repoDesc, image, tag, dockerFile) {
  var output = '', error = '';

  function dockerBuildSuccess() {
    util.info('Pushing Docker Image: ', image, `(${repo})`, tag);
    return docker
      .push(image)
      .then(() => {
        // cleanup
        util.verbose('Image Pushed: Cleaning Up');
        return docker.destroy(image);
      })
      .fail(null, (err) => {
        // cleanup failures too
        util.info('Image Push Failed: Cleaning Up');
        return docker
          .destroy(image)
          .then(() =>  {
            // pass the error on after cleanup
            throw err;
          });
      });
  }

  // progress output is essential for debugging
  function dockerBuildProgress(p) {
    if (p.error) {
      error += p.error;
    } else if (p.data) {
      output += p.data;
    }
  }

  return docker.build(image, dockerFile)
    .then(dockerBuildSuccess, null, dockerBuildProgress)
    .then(() => {
      return git.destroy(repoDesc);
    })
    .fail(pfail('build', repoDesc.id));
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
  util.info('Creating new Docker build', repo, image, tag);
  return git
    .create(repo, tag)
    .then((repoDesc) => {
      util.verbose('CWD -> ', repoDesc.path);
      process.chdir(repoDesc.path);
      util.info('Building Docker Image: ', image, `(${repo})`, tag);
      return dockerBuild(repo, repoDesc, image, tag, dockerFile);
    })
    .then(() => {
      return image;
    })
}

module.exports = {
  create
};
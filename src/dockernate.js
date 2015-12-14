'use strict';

const DOCKER_BUILD_HOOK_TIMEOUT = 120000;

const  Q = require('q'),
  git = require('./cli-wrappers/git'),
  npm = require('./cli-wrappers/npm'),
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

function dockerBuild(repo, repoDesc, image, tag, middleware, dockerFile) {
  var repoMasked = repo.split('@').filter((i) => i),
    d = Q.defer();
  repoMasked = repoMasked[repoMasked.length - 1];

  // start off the dockerBuild function
  docker
    .build(image, dockerFile)
    .then(dockerBuildSuccess, null, dockerProgress)
    .then(cleanGit)
    .then(d.resolve)
    .fail((err) => {
      pfail('build', repoDesc.id)(err)
        .fail(d.reject);
    });


  function dockerPushSuccess() {
    // cleanup
    util.verbose('Image Pushed: Cleaning Up');
    return docker.destroy(image);
  }

  function dockerPushFail(err) {
    // cleanup failures too
    util.info('Image Push Failed: Cleaning Up');
    return docker
      .destroy(image)
      .then(() =>  {
        // pass the error on after cleanup
        throw err;
      });
  }

  function dockerBuildSuccess() {
    util.info('Pushing Docker Image: ', image, `(${repoMasked})`, tag);
    return docker
      .push(image)
      .then(dockerPushSuccess, dockerPushFail, dockerProgress);
  }

  function cleanGit() {
    var cleanup = () => git.destroy(repoDesc);

    util.info('Running Dockernator Middleware');
    return middleware(repoDesc)
      .then(cleanup)
      .fail((err) => {
        return cleanup().then(() => {
          throw err;
        });
      });
  }

  // progress output is essential for debugging
  function dockerProgress(p) {
    d.notify(p);
  }

  return d.promise;
}

/**
 * @param {Q.Promise} promise
 * @param {number} delay
 * @param {string=} label
 * @returns {Q.Promise}
 */
function timeout(promise, delay, label) {
  label = label || '';
  var d = Q.defer(), to;

  to = setTimeout(() => {
    d.reject(new Error(
      `${label} promised to return, but took longer than ${delay}ms`));
  }, delay);

  promise.then(function () {
    clearTimeout(to);
    /** DO NOT ARROW FUNCTION THINGS WITH arguments */
    d.resolve.apply(d, arguments);
  }).fail((err) => {
    clearTimeout(to);
    d.reject(err);
  });

  return d.promise;
}

/**
 * @param {function():Q.Promise} middleware
 * @returns {function():Q.Promise}
 */
function validateMiddleware(middleware) {

  /** DO NOT ARROW FUNCTION THINGS WITH arguments */
  function tryMiddleware() {
    try {
      var prom = middleware.apply(null, arguments);
      return timeout(prom, DOCKER_BUILD_HOOK_TIMEOUT, 'Docker middleware');
    } catch (err) {
      return Q.reject(err);
    }
  }
  return tryMiddleware;
}

function prepareProject(backend) {
  if (backend !== 'static-npm') {
    util.info(`Preparing Project Backend: ${backend}`);
    return Q.resolve();
  }
  util.info(`Preparing Project Backend: ${backend}, CWD: ${process.cwd()}`);
  var d = Q.defer();
  npm.install()
    .then(() => {
      util.info(`Building Project From CWD: ${process.cwd()}`);
      return npm.build()
      .then(d.resolve, d.reject, d.notify);
    }, d.reject, d.notify)
  return d.promise;
}

/**
 * @param {string} backend type of project backend
 * @param {string} repo repository path/URI
 * @param {string} image name of docker image
 * @param {string=} tag SHA git tag, or actual git tag
 * @param {function():Q.Promise = } middleware
 * @param {string=} dockerFile
 * @returns {Q.Promise<string>} the image name
 */
function create(backend, repo, image, tag, middleware, dockerFile) {
  if (!repo || !image) {
    return Q.reject(
      new TypeError('Dockernator create requires repo, image'));
  }
  var repoMasked = repo.split('@').filter((i) => i),
    d = Q.defer();
  repoMasked = repoMasked[repoMasked.length - 1];
  middleware = validateMiddleware(middleware);
  util.info('Creating new Docker build', repoMasked, image, tag);
  git
    .create(repo, tag)
    .then((repoDesc) => {
      util.info('CWD -> ', repoDesc.path);
      process.chdir(repoDesc.path);
      return prepareProject(backend)
        .then(() => {}, d.reject, d.notify)
        .then(() => {
          util.info('Building Docker Image: ', image, `(${repoMasked})`, tag);
          return dockerBuild(repo, repoDesc, image, tag, middleware, dockerFile)
            .then(() => d.resolve(image), d.reject, d.notify);
        });
    }).fail(d.reject);
  return d.promise;
}

module.exports = {
  create
};

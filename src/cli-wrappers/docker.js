const COMMAND = 'docker',
  FLAG_BUILD = 'build',
  FLAG_FILE = '-f',
  FLAG_TAG = '-t',
  FLAG_PUSH = 'push',
  FLAG_RMI = 'rmi',
  DEFAULT_DOCKERFILE = 'Dockerfile',
  BUILD_CWD = './';

const spawn = require('child_process').spawn,
  Q = require('q');

/**
 * @param {string} tag
 * @param {string} dockerFile
 * @returns {Q.Promise}
 */
function build(tag, dockerFile) {
  if (!tag) {
    throw new TypeError('docker: build requires a tag string');
  }
  dockerFile = dockerFile || DEFAULT_DOCKERFILE;
  var d = Q.defer(),
    docker = spawn(COMMAND, [
      FLAG_BUILD, FLAG_TAG, tag, FLAG_FILE, dockerFile, BUILD_CWD
    ]),
    error = '',
    output = '';

  docker.stdout.on('data', (data) => {
    output += data;
  });

  docker.stderr.on('data', (data) => {
    error += data;
  });

  docker.on('close', (code) => {
    if (+code) {
      d.reject(new Error('docker terminated with exit code: ' + code));
    } else {
      d.resolve(output.trim());
    }
  });

  docker.stdin.end();

  return d.promise;
}

/**
 * @param {string} tag
 * @returns {Q.Promise}
 */
function push(tag) {
  if (!tag) {
    throw new TypeError('docker: push requires a tag string');
  }
  var d = Q.defer(),
    docker = spawn(COMMAND, [FLAG_PUSH, tag]),
    error = '',
    output = '';

  docker.stdout.on('data', (data) => {
    output += data;
  });

  docker.stderr.on('data', (data) => {
    error += data;
  });

  docker.on('close', (code) => {
    if (+code) {
      d.reject(new Error('docker terminated with exit code: ' + code));
    } else {
      d.resolve(output.trim());
    }
  });

  docker.stdin.end();

  return d.promise;
}

function destroy(tag) {
  if (!tag) {
    throw new TypeError('docker: destroy requires a tag string');
  }
  var d = Q.defer(),
    docker = spawn(COMMAND, [FLAG_RMI, tag]),
    error = '',
    output = '';

  docker.stdout.on('data', (data) => {
    output += data;
  });

  docker.stderr.on('data', (data) => {
    error += data;
  });

  docker.on('close', (code) => {
    if (+code) {
      d.reject(new Error('docker terminated with exit code: ' + code));
    } else {
      d.resolve(output.trim());
    }
  });

  docker.stdin.end();

  return d.promise;

}

module.exports = {
  build,
  push,
  destroy
};

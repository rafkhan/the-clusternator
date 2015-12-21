const spawn = require('child_process').spawn,
  path = require('path'),
  util = require('../util'),
  Q = require('q');

const COMMAND = path.join(
  __dirname, '..', '..', 'bin', 'generate-private-sha.sh');


/**
 * @param {string} pathToSha
 * @returns {Q.Promise}
 */
function genSha(pathToSha) {
  if (!pathToSha) {
    throw new TypeError('genSha requires a path to generate a SHA from');
  }

  var d = Q.defer(),
    gSha = spawn(COMMAND, [pathToSha]),
    error = '', output = '';

  gSha.stdout.setEncoding('utf8');
  gSha.stderr.setEncoding('utf8');

  gSha.stdout.on('data', (data) => {
    output += data;
  });

  gSha.stderr.on('data', (data) => {
    error += data;
  });

  gSha.on('close', (code) => {
    if (+code) {
      d.reject(
        new Error(`genSha terminated with exit code: ${code} msg: ${error}`));
    } else {
      d.resolve(output);
    }
  });

  gSha.stdin.end();

  return d.promise;
}

module.exports = {
  genSha
};

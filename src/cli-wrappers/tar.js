const COMMAND = 'tar';
const FLAG_BALL = 'cfz';
const FLAG_EXTRACT = 'xfz';
const EXTENSION_TAR = '.tar';
const EXTENSION_GZ = '.gz';
const EXTENSION = EXTENSION_TAR + EXTENSION_GZ;

var spawn = require('child_process').spawn,
  Q = require('q');

/**
  @param {string} tarball name/path of the tarball to make
  @return {string} string with _one_ .tar.gz extension
*/
function addExtension(tarball) {
  var existing = tarball.indexOf(EXTENSION);
  if (existing === tarball.length - EXTENSION.length) {
    return tarball;
  }
  existing = tarball.indexOf(EXTENSION_TAR);
  if (existing === tarball.length - EXTENSION_TAR.length) {
    return tarball + EXTENSION_GZ;
  }
  return tarball + EXTENSION;
}

/**
  @param {string} tarball name/path of the tarball to make
  @param {string|string[]} files/paths to ball up
  @return {Q.Promise}
*/
function ball(tarball, files) {
  if (!Array.isArray(files)) {
      files = [files];
  }
  tarball = addExtension(tarball);
  var d = Q.defer(),
    tar = spawn(COMMAND, [FLAG_BALL, tarball].concat(files)),
    error = '',
    output = '';

  tar.stdout.on('data', (data) => {
    output += data;
  });

  tar.stderr.on('data', (data) => {
    error += data;
  });

  tar.on('close', (code) => {
    if (error) {
      d.reject(new Error(error));
    } else if (+code) {
      d.reject(new Error('tar terminated with exit code: ' + code));
    } else {
      d.resolve(output);
    }
  });

  tar.stdin.end();

  return d.promise;
}

/**
  @param {string} tarball name/path of the tarball to extract
  @return {Q.Promise}
*/
function extract(tarball) {
  var d = Q.defer(),
    tar = spawn(COMMAND, [FLAG_EXTRACT, tarball]),
    error = '',
    output = '';

  tar.stdout.on('data', (data) => {
    output += data;
  });

  tar.stderr.on('data', (data) => {
    error += data;
  });

  tar.on('close', (code) => {
    if (error) {
      d.reject(new Error(error));
    } else if (+code) {
      d.reject(new Error('tar terminated with exit code: ' + code));
    } else {
      d.resolve(output);
    }
  });

  tar.stdin.end();

  return d.promise;
}

module.exports = {
  ball,
  extract,
  helpers: {
    addExtension
  }
};

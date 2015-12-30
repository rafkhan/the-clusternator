'use strict';

const COMMAND = 'tar';
const FLAG_BALL = 'cfz';
const FLAG_EXTRACT = 'xfz';
const EXTENSION_TAR = '.tar';
const EXTENSION_GZ = '.gz';
const EXTENSION = EXTENSION_TAR + EXTENSION_GZ;

var cproc = require('./child-process');

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
  return cproc.output(COMMAND, [FLAG_BALL, tarball].concat(files));
}

/**
  @param {string} tarball name/path of the tarball to extract
  @return {Q.Promise}
*/
function extract(tarball) {
  return cproc.output(COMMAND, [FLAG_EXTRACT, tarball]);
}

module.exports = {
  ball,
  extract,
  helpers: {
    addExtension
  }
};

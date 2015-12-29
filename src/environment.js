'use strict';
const path = require('path');
var util = require('./util');

var DEFAULT_ENV = Object.freeze({
    host: '127.0.0.1',
    port: '8000',
    protocol: 'http://'
  });

function findPackageJSON_(fullpath) {
  try {
     return require(path.join(fullpath + '/package.json'));
  } catch (err) {
     var pathSplit = fullpath.split(path.sep);
     pathSplit.pop();
     if (!pathSplit.length) {
       return null;
     }
     return findPackageJSON_(pathSplit.join(path.sep));
  }
}

function findPackageJSON() {
    var cwd = process.cwd(),
    p = findPackageJSON_(cwd);

    util.info(p);
}

function init(e) {
  var env = e || DEFAULT_ENV;
}

function load() {

}

module.exports = {
  init: init,
  load: load,
  find: findPackageJSON
};

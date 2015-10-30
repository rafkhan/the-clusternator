'use strict';
var path = require('path');

var DEFAULT_ENV = Object.freeze({
  host: '127.0.0.1',
  port: '8000',
  protocol: 'http://'
});

function findPackageJSON_(_x) {
  var _again = true;

  _function: while (_again) {
    var fullpath = _x;
    _again = false;

    try {
      return require(path.join(fullpath + '/package.json'));
    } catch (err) {
      var pathSplit = fullpath.split(path.sep);
      pathSplit.pop();
      if (!pathSplit.length) {
        return null;
      }
      _x = pathSplit.join(path.sep);
      _again = true;
      pathSplit = undefined;
      continue _function;
    }
  }
}

function findPackageJSON() {
  var cwd = process.cwd(),
      p = findPackageJSON_(cwd);

  console.log(p);
}

function init(e) {
  var env = e || DEFAULT_ENV;
}

function load() {}

module.exports = {
  init: init,
  load: load,
  find: findPackageJSON
};
'use strict';
/**
 * Common utility functions for the clusternator APIs
 * @module api/'0.1'/common
 */

const SRC= ['..', '..'];
const srcCat = SRC.concat.bind(SRC);

const path = require('path');

module.exports = {
  src
};

/**
 * Wraps `require`, expects an array of strings as arguments.  Resolves paths
 * based on the _relative_ location of the source root (transpilation safe0
 *
 * - Paths are OS normalized using `path`
 * - Paths are always _relative_ to _this file_
 * @returns {*}
 * @example src('server', 'main'); // require('../../server/main');
 */
function src() {
  var args = Array.prototype.slice.call(arguments, 0);
  return require(path.join.apply(path, srcCat(args)));
}

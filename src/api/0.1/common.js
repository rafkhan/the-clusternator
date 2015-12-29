'use strict';

const SRC= ['..', '..'];
const srcCat = SRC.concat.bind(SRC);

const path = require('path');

module.exports = {
  src
};

/**
 * @returns {string|*}
 */
function src() {
  var args = Array.prototype.slice.call(arguments, 0);
  return require(path.join.apply(path, srcCat(args)));
}

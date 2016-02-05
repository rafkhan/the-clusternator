'use strict';

let cn = require('../js/js-api');
const GAP = '  ';

module.exports = {
  list
};

/**
 * @param {*} v
 * @returns {boolean}
 */
function isObject(v) {
  return (v && typeof v === 'object') ? true : false;
}

/**
 * @param {string} k
 * @param {*} v
 * @param {string=} prefix
 */
function logTuple(k, v, prefix) {
  prefix = prefix || '';
  if (isObject(v)) {
    console.log(prefix + k + ':');
    return logObject(v, prefix + GAP);
  }
  console.log(`${GAP}${k}: ${v}`);
}

/**
 * @param {*} obj
 * @param {string=} prefix
 */
function logObject(obj, prefix) {
  if (!isObject(obj)) { return; }
  Object.keys(obj)
    .forEach((k) => logTuple(k, obj[k], prefix));
}

/**
 * @returns {Promise<string>}
 */
function list() {
  return cn
    .listAuthorities()
    .then(logObject)
    .fail((err) => {
      console.log(`Error listing authorities: ${err.message}`);
    });
}

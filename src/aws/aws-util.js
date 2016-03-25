'use strict';

const util = require('../util');

module.exports = {
  bindAws 
};

/**
 * Partially applies aws to every _function_ on the target object
 * @param {AwsWrapper} aws
 * @param {Object} target
 * @returns {Object}
 */
function bindAws(aws, target) {
  if (!target || typeof target !== 'object') {
    throw new TypeError('bindAws requires a target _object_ to bind to'); 
  }
  return Object.keys(target).reduce((api, key) => {
    if (key === 'bindAws') {
      api[key] = target[key];
      return api;
    }
    if (util.isFunction(target[key])) {
      api[key] = util.partial(target[key], [ aws ]); 
    } else {
      api[key] = target[key];
    }
    return api;
  }, {});
}
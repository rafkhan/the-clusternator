'use strict';
/**
 * Interface between the CLI, and remote REST API
 *
 * @module clusternator/authorities
 */

const makePostRequest = require('./common').makePostRequest;

module.exports = {
  list
};

/**
 * @return {Promise}
 */
function list() {
  return makePostRequest('/authorities/list', false);
}
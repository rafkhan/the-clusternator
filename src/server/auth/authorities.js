'use strict';
/**
 * @module server/authorities
 */

/*global require, module*/

const config = require('../../config')();
const DEFAULT_AUTHORITY = 2;
const authorityTypes = config.privilegeGroups;
const find = require('./auth-common').find;

module.exports = {
  find: find,
  create: createAuthority,
  change: changeAuthority,
  types: authorityTypes
};

/**
 * @param {string} id
 * @param {number} authority
 * @return {{ id: string, authority: number }}
 */
function validateAuthority(id, authority) {
  if (authorityTypes[authority + ''] === undefined) {
    return { id: id, authority: DEFAULT_AUTHORITY };
  }
  return { id: id, authority: +authority };
}

/**
 * @param {function(string|*, *=)} db
 * @param {string} id
 * @param {number} authority
 * @return {Promise}
 */
function createAuthority(db, id, authority) {
  return find(db, id).then(() => {
    // invalid case
    throw new Error('authority exists');
  }, () => db(validateAuthority(id, authority))()); // expected case
}

/**
 * @param {function(string|*, *=)} db
 * @param {string} id
 * @param {number} authority
 * @return {Promise}
 */
function changeAuthority(db, id, authority) {
  // change passwords
  return find(db, id)
    .then(() => db(validateAuthority(id, authority))());
}

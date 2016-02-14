'use strict';
/**
 * @module server/authorities
 */

/*global require, module*/

const authorities = Object.create(null);
const config = require('../../config')();
const Q = require('q');
const DEFAULT_AUTHORITY = 2;
const authorityTypes = config.privilegeGroups;

module.exports = {
  find: find,
  create: createAuthority,
  change: changeAuthority,
  types: authorityTypes
};

/**
 * @param {number} authority
 * @return {{ authority: number }}
 */
function validateAuthority(id, authority) {
  if (authorityTypes[authority + ''] === undefined) {
    return { id: id, authority: DEFAULT_AUTHORITY};
  }
  return {id: id, authority: +authority};
}

function isSet(id) {
  if (authorities[id] === undefined) {
    return false;
  }
  if (authorities[id] === null) {
    return false;
  }
  return true;
}

/**
 * @param {string} id
 * @return {Q.Promise<number>}
 */
function find(id) {
  const d = Q.defer();
  if (isSet(id)) {
    d.resolve(authorities[id]);
  } else {
    d.reject(new Error('not found'));
  }
  return d.promise;
}

/**
 * @param {string} id
 * @param {number} authority
 * @return {Q.Promise}
 */
function createAuthority(id, authority) {
  return find(id).then(() => {
    // invalid case
    throw new Error('password exists');
  }, () => {
    // expected case
    authorities[id] = validateAuthority(id, authority);
    return authorities[id];
  });
}

function changeAuthority_(id, authority) {
  const d = Q.defer();
  authorities[id] = validateAuthority(id, authority);
  d.resolve();
  return d.promise;
}

/**
 * @param {string} id
 * @param {number} authority
 * @return {Q.Promise}
 */
function changeAuthority(id, authority) {
  // change passwords
  return find(id).then(() => {
    return changeAuthority_(id, authority);
  });
}

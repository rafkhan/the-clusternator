'use strict';

/*global require, module*/

var authorities = Object.create(null),
  config = require('../../config')(),
  Q = require('q'),
  DEFAULT_AUTHORITY = 2,
  authorityTypes = config.privilegeGroups;

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
  if (+authority >= 0 && +authority < authorityTypes.length) {
    return { id: id, authority: +authority };
  }
  return { id: id, authority: DEFAULT_AUTHORITY};
}

/**
 * @param {string} id
 * @return {Q.Promise<number>}
 */
function find(id) {
  var d = Q.defer();
  if (authorities[id]) {
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
  var d = Q.defer();
  authorities[id] = validateAuthority(id, authority)
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

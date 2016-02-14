'use strict';
/**
 * Password management system for the server
 *
 * @module server/passwords
 */

/*global require, module*/

const passwords = Object.create(null);
const saltHash = require('./crypto-hash').saltHash;
const verifyHash = require('./crypto-hash').verify;
const Q = require('q');

/**
 * @param {string} id
 * @returns {Q.Promise}
 */
function find(id) {
  const d = Q.defer();
  if (passwords[id]) {
    d.resolve(passwords[id]);
  } else {
    d.reject(new Error('not found'));
  }
  return d.promise;
}

/**
 * @param {string} id
 * @param {string} newPass
 * @returns {Q.Promise}
 */
function createPassword(id, newPass) {
  return find(id).then(() => {
    // invalid case
    throw new Error('password exists');
  }, () => {
    // expected case
    return saltHash(newPass).then((shash) => {
      passwords[id] = {
        saltedHash: shash
      };
    });
  });
}

function changePassword_(id, shash) {
  const d = Q.defer();
  passwords[id].saltedHash = shash;
  d.resolve();
  return d.promise;
}

/**
 * @param {string} id
 * @param {string} oldPass
 * @param {string} newPass
 * @returns {Q.Promise}
 */
function changePassword(id, oldPass, newPass) {
  // change passwords
  return verify(id, oldPass).then(() => {
    return saltHash(newPass).then((shash) => {
      return changePassword_(id, shash);
    });
  });
}

/**
 * @param {string} id
 * @param {string} password
 * @returns {Q.Promise}
 */
function verify(id, password) {
  return find(id).then((row) => {
    return verifyHash(row.saltedHash, password);
  });
}

module.exports = {
  find,
  create: createPassword,
  change: changePassword,
  verify
};


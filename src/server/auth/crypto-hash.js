'use strict';
/**
 *  More or less a promise wrapper around credential
 *
 * @module server/cryptoHash
 */

/**
 */
/*global require, module */


const Q = require('q');
const pw = require('credential');
const pwHash = Q.nbind(pw.hash, pw);
const pwVerify = Q.nbind(pw.verify, pw);

module.exports = {
  saltHash: saltHash,
  saltHashUser: saltHashUser,
  verify: verify
};

/**
 * @param {string} password
 * @returns {Q.Promise}
 */
function saltHash(password) {
  return pwHash(password + '');
}


/**
 * @param {{ password: string }} user
 * @returns {Q.Promise}
 */
function saltHashUser(user) {
  return saltHash(user.password).then((saltedHash) => {
    user.password = saltedHash;
    return user;
  });
}

/**
 * @param {string} storedSaltedHash
 * @param {string} input
 */
function verify(storedSaltedHash, input) {
  return pwVerify(storedSaltedHash, input + '')
    .then((isValid) => {
      if (isValid) {
        return Q.resolve(true);
      } else {
        return Q.reject(new Error('Password does not match salted hash'));
      }
    });
}


'use strict';

/**
 *  More or less a promise wrapper around credential
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
  try {
    return pwHash(password + '');
  } catch (err) {
    console.log('hash error');
    return Q.reject(err);
  }
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
  try {
    return pwVerify(storedSaltedHash, input + '');
  } catch (err) {
    return Q.reject(err);
  }
}


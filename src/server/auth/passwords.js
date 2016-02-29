'use strict';
/**
 * Password management system for the server
 *
 * @module server/passwords
 */

/*global require, module*/

let cryptoHash = require('./crypto-hash');
const find = require('./auth-common').find;

module.exports = {
  find,
  create: createPassword,
  change: changePassword,
  verify
};

/**
 * @param {function(string|*, *=)} db
 * @param {string} id
 * @param {string} newPass
 * @returns {Promise}
 */
function createPassword(db, id, newPass) {
  return find(db, id)
    .then(() => {
      // invalid case
      throw new Error('password exists');
    }, () => cryptoHash.saltHash(newPass) // expected case
      .then((shash) => db({
          id: id,
          saltedHash: shash
        })()
      ));
}

/**
 * @param {function(string|*, *=)} db
 * @param {string} id
 * @param {string} shash
 * @returns {Promise}
 * @private
 */
function changePassword_(db, id, shash) {
  return db({
    id: id,
    saltedHash: shash
  })();
}

/**
 * @param {function(string|*, *=)} db
 * @param {string} id
 * @param {string} oldPass
 * @param {string} newPass
 * @returns {Promise}
 */
function changePassword(db, id, oldPass, newPass) {
  // change passwords
  return verify(db, id, oldPass).then(() => {
    return cryptoHash.saltHash(newPass).then((shash) => {
      return changePassword_(db, id, shash);
    });
  });
}

/**
 * @param {function(string|*, *=)} db
 * @param {string} id
 * @param {string} password
 * @returns {Promise}
 */
function verify(db, id, password) {
  return find(db, id)
    .then((row) => cryptoHash.verify(row.saltedHash, password));
}


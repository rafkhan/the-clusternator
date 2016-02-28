'use strict';
/**
 * Token salt/hash management system for the server
 *
 * @module server/tokens
 */
/*global require, module*/
const TOKEN_SIZE = 64;
const MAX_TOKENS = 5;
const DELIM = ':';

let cryptoHash = require('./crypto-hash');
const crypto = require('crypto');
const b64 = require('base64url');
const findBase = require('./auth-common').find;
const find = (db, id) => findBase(db, id).then((r) => r.saltedHashes);
const Q = require('q');

module.exports = {
  findById: find,
  find: findByToken,
  create: createToken,
  clear: clearTokens,
  invalidate: invalidateToken,
  verify: verifyByToken,
  userFromToken: userFromToken
};

/**
 * @param {function(string|*, *=)} db
 * @param {string} token
 * @returns {Promise.<Array.<string>>}
 */
function findByToken(db, token) {
  const details = splitToken(token);
  return find(db, details.id);
}


/**
 * @param {function(string|*, *=)} db
 * @param {string} id
 * @param {Array.<string>} saltedHashes
 * @returns {Promise}
 */
function saveUserTokens(db, id, saltedHashes) {
  return db({
    id,
    saltedHashes
  })();
}

/**
 * @returns {Q.Promise<string>}
 */
function createToken_() {
  const d = Q.defer();
  crypto.randomBytes(TOKEN_SIZE, (err, buff) => {
    if (err) {
      d.reject(err);
      return;
    }
    d.resolve(b64(buff));
  });
  return d.promise;
}

/**
 * @param {function(string|*, *=)} db
 * @param {string} id
 * @param {Array.<string>} saltedHashes
 * @returns {Promise<string>}
 */
function createSaltAndSave(db, id, saltedHashes) {
  /*eslint no-console: 0*/
  return createToken_()
    .then((newToken) => cryptoHash
      .saltHash(newToken)
      .then((shash) => {
        saltedHashes.push(shash);
        return saveUserTokens(db, id, saltedHashes);
      })
      .then(() => id + DELIM + newToken));
}

/**
 * @param {function(string|*, *=)} db
 * @param {string} id
 * @returns {Q.Promise<Array.<string>>}
 */
function createToken(db, id) {
  return find(db, id)
    .then((foundTokens) => {
      if (foundTokens.length > MAX_TOKENS) {
        throw new Error(`User has maximum tokens (${MAX_TOKENS})`);
      }
      return createSaltAndSave(db, id, foundTokens);
    }, () => createSaltAndSave(db, id, []));
}

function splitToken(token) {
  const st = token.split(DELIM);
  if (st.length !== 2) {
    throw new TypeError('Invalid Token');
  }
  return {
    id: st[0],
    token: st[1]
  };
}

/**
 * @param {function(string|*, *=)} db
 * @param {string} token
 * @returns {Promise.<T>|Request|*}
 */
function invalidateToken(db, token) {
  const details = splitToken(token);
  const id = details.id;
  token = details.token;
  return verify(db, id, token)
    .then((verified) => saveUserTokens(db, id, verified.saltedHashes
      .filter((t, i) => i !== verified.index )));
}

/**
 * @param {function(string|*, *=)} db
 * @param {string} id
 * @param {string} token
 * @returns {Promise<{ index: number, saltedHashes: Array.<string>}>}
 */
function verify(db, id, token) {
  return find(db, id)
    .then((saltedHashes) => Q
      .allSettled(saltedHashes.map((t) => cryptoHash.verifyHash(t, token)))
      .then((results) => {
        let index = -1;
        results.forEach((r, i) => {
          if (r.state === 'fulfilled') {
            index = i;
          }
        });
        if (index === -1) {
          throw new Error('token not found');
        }
        return {
          index,
          saltedHashes
        };
      })
    );
}

/**
 * @param {function(string|*, *=)} db
 * @param {string} token
 * @returns {Promise.<{found: number, saltedHashes: Array.<string>}>}
 */
function verifyByToken(db, token) {
  const details = splitToken(token);
  return verify(db, details.id, details.token);
}

/**
 * @param {string} token
 * @returns {string}
 */
function userFromToken(token) {
  return splitToken(token).id;
}

/**
 * @param {function(string|*, *=)} db
 * @param {string} userId
 * @returns {Promise}
 */
function clearTokens(db, userId) {
  return db({
    id: userId,
    saltedHashes: []
  })();
}



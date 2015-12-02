'use strict';

/*global require, module*/
const TOKEN_SIZE = 64;
const MAX_TOKENS = 5;

var tokens = Object.create(null),
  crypto = require('crypto'),
  hash = require('./crypto-hash'),
  b64 = require('base64url'),
  Q = require('q');

/**
 * @param {string} id
 * @returns {Q.Promise}
 */
function find(id) {
  var d = Q.defer();
  if (tokens[id]) {
    d.resolve(tokens[id]);
  } else {
    d.resolve([]);
  }
  return d.promise;
}

function saveUserTokens(id, userTokens) {
  var d = Q.defer();
  tokens[id] = userTokens;
  d.resolve();
  return d.promise;
}

/**
 * @returns {Q.Promise<string>}
 */
function createToken_() {
  var d = Q.defer();
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
 * @param {string} id
 * @returns {Q.Promise<string>}
 */
function createToken(id) {
  return find(id).then((foundTokens) => {
    if (foundTokens.length > MAX_TOKENS) {
      throw new Error(`User has maximum tokens (${MAX_TOKENS})`);
    }
    return createToken_().then((newToken) => {
      return hash.saltHash(newToken).then((shash) => {
        foundTokens.push(shash);
        return saveUserTokens(id, foundTokens);
      }).then(() => {
        return newToken;
      });
    });
  });
}

function invalidateToken(id, token) {
  return verify(id, token).then((index) => {
    if (index === null) {
      return;
    }
    return find(id).then((tokens) => {
      return saveUserTokens(id, tokens.filter((t, i) => {
        if (i === index) {
          return false;
        }
        return true;
      }));
    });
  });
}

/**
 * @param {string} id
 * @param {string} token
 * @returns {Q.Promise<number>}
 */
function verify(id, token) {
  return find(id).then((tokens) => {
    return Q.allSettled(tokens.map((t) => {
      return hash.verify(t, token);
    })).then((results) => {
      var found = null;
      results.forEach((r, i) => {
        if (r.state === 'fulfilled') {
          found = i;
        }
      });
      if (found === null) {
        throw new Error('token not found');
      }
      return found;
    });
  });
}

module.exports = {
  find,
  create: createToken,
  invalidate: invalidateToken,
  verify
};


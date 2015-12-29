'use strict';
/*global require, module*/
const TOKEN_SIZE = 64;
const MAX_TOKENS = 5;
const DELIM = ':';

var tokens = Object.create(null);
var crypto = require('crypto');
var hash = require('./crypto-hash');
var b64 = require('base64url');
var Q = require('q');

/**
 * @param {string} token
 * @returns {Q.Promise<string>}
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

/**
 * @param {string} token
 * @returns {Q.Promise.<string>}
 */
function findByToken(token) {
  var details = splitToken(token);
  return find(details.id);
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
        return id + DELIM + newToken;
      });
    });
  });
}

function splitToken(token) {
  var splitToken = token.split(DELIM);
  if (splitToken.length !== 2) {
    throw new TypeError('Invalid Token');
  }
  return {
    id: splitToken[0],
    token: splitToken[1]
  }
}

function invalidateToken(token) {
  var details = splitToken(token),
    id = details.id;
  token = details.token;
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

function verifyByToken(token) {
  var details = splitToken(token);
  return verify(details.id, details.token);
}

function userFromToken(token) {
  return splitToken(token).id;
}

module.exports = {
  findById: find,
  find: findByToken,
  create: createToken,
  invalidate: invalidateToken,
  verify: verifyByToken,
  userFromToken: userFromToken
};


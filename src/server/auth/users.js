'use strict';
/**
 * User management system for the server
 *
 * @module server/users
 */

/*global require, module*/

let passwords = require('./passwords');
let tokens = require('./tokens');
let authorities = require('./authorities');
const config = require('../../config')();
const Q = require('q');
const MIN_PASS_LEN = config.minPasswordLength || 13;
const PROJECT_USER_TAG = require('../../constants').PROJECT_USER_TAG;
let DBS = null; // @todo this global solution is supposed to be interim

let wrappedTokens = {
  find: (t) => tokens.find(DBS.tokens, t),
  create: (i) => tokens.create(DBS.tokens, i),
  clear: (i) => tokens.clear(DBS.tokens, i),
  verify: (t) => tokens.verify(DBS.tokens, t),
  userFromToken: tokens.userFromToken
};

module.exports = {
  init,
  find: find,
  create: createUser,
  verifyPassword: verifyPassword,
  tokens: wrappedTokens,
  endpoints: {
    update: updateUserEndpoint,
    create: createUserEndpoint,
    password: changePassword,
    get: getUser,
    createToken: createToken
  }
};


/**
 * @param {{ passwords: function(string|*, *=), authorities(string|*, *=) }} dbs
 * @returns {Promise}
 */
function init(dbs) {
  DBS = dbs;
  return passwords.find(DBS.passwords, 'root')
    .fail(() => createUser({
      id: 'root',
      authority: 0,
      password: config.setupRootPass
    }));
}

/**
 * @param {string} id
 * @param {string} password
 * @returns {Promise}
 */
function verifyPassword(id, password) {
  if (!DBS) {
    return Q.reject(new Error('not initialized'));
  }
  return passwords.verify(DBS.passwords, id, password);
}

/**
 * @param {{ id: string, password: string }} user
 * @returns {Promise}
 */
function validateCreateUser(user) {
  if (!DBS) {
    return Q.reject(new Error('not initialized'));
  }
  if (!user || !user.id) {
    return Q.reject(new TypeError('createUser: Invalid User Id'));
  }
  if (!user.password) {
    return Q.reject(new TypeError('createUser: Invalid User Password'));
  }
  if (user.password.length < MIN_PASS_LEN) {
    return Q.reject(new Error(
      `password too short.  Must be at least ${MIN_PASS_LEN}`));
  }
  if (user.id.indexOf(PROJECT_USER_TAG) === 0) {
    return Q.reject(
      new Error(`User Names cannot begin with ${PROJECT_USER_TAG}`));
  }
  return passwords.find(DBS.passwords, user.id)
    .then(() => {
      throw new Error('createUser: User Exists');
    }, Q.resolve);
}

/**
 * @param {{ id: string, password: string, authority: number }} user
 * @returns {Q.Promise}
 */
function createUser(user) {
  if (!DBS) {
    return Q.reject(new Error('not initialized'));
  }
  return validateCreateUser(user)
    .then(() => {
      return Q.all([
        passwords.create(DBS.passwords, user.id, user.password),
        authorities.create(DBS.authorities, user.id, user.authority)
      ]).then((results) => {
        // kill off the password attribute
        delete user.password;
        // create a _new_ user object
        return {
          id: user.id,
          authority: results[1].authority
        };
      });
    });
}

/**
 * @param {string} id
 * @returns {Q.Promise}
 */
function find(id) {
  if (!DBS) {
    return Q.reject(new Error('not initialized'));
  }
  return authorities
    .find(DBS.authorities, id)
    .then((auth) => {
      return {
        id: id,
        authority: auth.authority
      };
    });
}

function changePassword(req, res) {
  passwords.change(req.body.username,
    req.body.password, req.body.passwordNew).
  then(() => {
    if (req.get('ContentType') === 'application/json') {
      res.sendStatus(200);
    } else {
      res.redirect('/');
    }
  }, (err) => {
    if (req.get('ContentType') === 'application/json') {
      res.status(500).json({error: err.message});
    } else {
      res.render('passwd', { error: true });
    }
  });
}

function createUserEndpoint(req, res) {
  createUser({
    id: req.body.username,
    password: req.body.password
  }).then((user) => {
    res.json(user);
  }, (err) => {
    res.status(500).json({error: err.message});
  });
}

function updateUserEndpoint_(req, res) {
  const id = req.body.username;
  const authority = req.body.authority;
  if (!DBS) {
    return Q.reject(new Error('not initialized'));
  }

  find(id).then((found) => {
    return authorities.change(DBS.authorities, id, authority).then(() => {
      res.sendStatus(200);
    });
  }, () => {
    const password = req.body.password;
    return createUser({
      id:id,
      password:password,
      authority:authority,
    }).then((user) => {
      res.json(user);
    });
  }).fail((err) => {
    res.status(500).json({ error: err.message });
  });
}

function updateUserEndpoint(req, res) {
  const id = req.body.username;
  const authority = req.body.authority;

  // admins can edit anyone
  if (req.user.authority === 0) {
    updateUserEndpoint_(req, res);
    return;
  }
  // users can edit themselves
  if (req.user.id === id) {
    updateUserEndpoint_(req, res);
    return;
  }
  res.status(401).json({ error: 'not authorized' });
}

function getUser(req, res) {
  find(req.params.id).then((user) => {
    // admins can see admins
    if (req.user.authority === 0) {
      res.json(user);
      return;
    }
    if (req.user.id === req.body.id) {
      res.json(user);
      return;
    }
  });
}

function createToken(req, res) {
  tokens.create(req.user.id).then((token) => {
    res.render('create-token', { token: token });
  }, (err) => {
    res.status(500).json({ error: err });
  });
}

'use strict';
/**
 * @module server/authentication
 */

/*global require, __dirname, module */

// sets up, and initializes authentication
const LocalStrategy = require('passport-local').Strategy;
const HeaderStrategy = require('passport-http-header-token').Strategy;
const Config = require('../../config');
const passport = require('passport');
const logger = require('../loggers').logger;
const constants = require('../../constants');

let users = require('./users');
const tokens = users.tokens;

let config = Config();
let app = null;

function init(appObj) {
  app = appObj;
  passport.use('login-local', new LocalStrategy(authLocal));
  passport.use('auth-header', new HeaderStrategy({}, authToken));
  app.use(passport.initialize());

  passport.serializeUser(serializeUser);
  passport.deserializeUser(deserializeUser);
}

function authToken(token, done) {
  logger.info('authToken');
  tokens.verify(token).then(() => {
    logger.info('authToken: verified');
    const user = tokens.userFromToken(token);
    logger.info('authToken: user token');
    return users.find(user).then((user) => {
      logger.verbose('authToken: user found');
      done(null, user);
    });
  }).fail(done);
}

function authLocal(user, pass, done) {
  return users
    .verifyPassword(user, pass)
    .then(() => {
      logger.info(`authLocal: ${user} password verified`);
      return users
        .find(user)
        .then((found) => {
          logger.verbose('authLocal: User Found');
          done(null, found);
        });
    }).fail((err) => {
      logger.error('Authentication Error', err.message);
      done(null, false, {message: 'Invalid Login Credentials'});
    });
}

/**
 * @param {Error|null} err
 * @param {Object} res
 * @param {Object} user
 */
function afterLogin(err, res, user) {
  logger.debug('Authenticate User Post Login');
  if (err) {
    res.status(500).json({ error: true });
  } else {
    tokens
      .clear(user.id)
      .then(() => tokens
        .create(user.id)
        .then((token) => {
          user.token = token;
          res.json(user);
        }))
      .fail((err) => res.status(500).json({ error: err.message }));
  }
}

function authenticateUserEndpoint(req, res, next) {
  logger.debug('Authenticate User Start');
  passport.authenticate('login-local', (err, user) => {
    logger.debug('Authenticate User Post Passport');
    if (err) {
      logger.error(err.message);
      res.status(500).json({ error: true });
      return;
    }
    if (!user) {
      logger.error('User not found: ');
      res.sendStatus(401);
      return;
    }
    req.logIn(user, () => afterLogin(err, res, user));
  })(req, res, next);
}

function logoutUser(req, res, next) {
  req.session.destroy(() => {
    res.sendStatus(200);
  });
}

function serializeUser(user, cb) {
  cb(null, user.id);
}

function deserializeUser(id, cb) {
  users.find(id).then(function (user) {
    cb(null, user);
  }, cb);
}

module.exports = {
  init: init,
  endpoints: {
    login: authenticateUserEndpoint,
    logout: logoutUser
  }
};

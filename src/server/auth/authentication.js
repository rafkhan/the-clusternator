'use strict';

/*global require, __dirname, module */

// sets up, and initializes authentication
var LocalStrategy = require('passport-local').Strategy;
var HeaderStrategy = require('passport-http-header-token').Strategy;
var Config = require('../../config');
var passport = require('passport');
var users = require('./users');
var passwords = require('./passwords');
var logger = require('../loggers').logger;
var tokens = require('./tokens');

var config = Config();

function init(app) {
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
    return users.find(tokens.userFromToken(token)).then((user) => {
      logger.verbose('authToken: user found');
      done(null, user);
    });
  }).fail(done);
}

function authLocal(user, pass, done) {
  return passwords.verify(user, pass).then(() => {
    logger.info('authLocal: Password Verified');
    return users.find(user).then((found) => {
      logger.verbose('authLocal: User Found');
      done(null, found);
    });
  }).fail((err) => {
    logger.error('Authentication Error', err.message);
    done(null, false, {message: 'Invalid Login Credentials'});
  });
}

function authenticateUserEndpoint(req, res, next) {
  logger.debug('Authenticate User Start');
  passport.authenticate('login-local', (err, user, info) => {
    logger.debug('Authenticate User Post Passport');
    if (err) {
      res.status(500).json({error: true });
      return;
    }
    if (!user) {
      res.sendStatus(401);
      return;
    }
    req.logIn(user, (err) => {
      logger.debug('Authenticate User Post Login');
      if (err) {
        res.status(500).json({error: true});
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
    });
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

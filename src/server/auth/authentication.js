'use strict';

/*global require, __dirname, module */

// sets up, and initializes authentication
var LocalStrategy = require('passport-local').Strategy,
  HeaderStrategy = require('passport-http-header-token').Strategy,
  Config = require('../../config'),
  passport = require('passport'),
  session = require('express-session'),
  users = require('./users'),
  passwords = require('./passwords'),
  tokens = require('./tokens');

var config = Config();

function init(app) {
  app.use(session({
    secret: config.sessionSecret,
    resave: true,
    saveUninitialized: true,
    name: config.sessionCookieName || 'connect.sid'
  }));

  passport.use('login-local', new LocalStrategy(authLocal));
  passport.use('auth-header', new HeaderStrategy({}, (token, done) => {
    tokens.verify(token).then(() => {
      return users.find(tokens.userFromToken(token)).then((user) => {
        done(null, user);
      });
    }).fail(done);
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(serializeUser);
  passport.deserializeUser(deserializeUser);
}

function authLocal(user, pass, done) {
  return passwords.verify(user, pass).then(function () {
    return users.find(user).then(function (found) {
      done(null, found);
    });
  }).fail(function () {
    done(null, false, {message: 'Invalid Login Credentials'});
  });
}

function authenticateUserEndpoint(req, res, next) {
  passport.authenticate('login-local', function (err, user, info) {
    if (req.get('ContentType') === 'application/json') {
      if (err) {
        res.status(500).json({error: err.message});
        return;
      }
      if (!user) {
        res.sendStatus(401);
        return;
      }
    } else {
      if (err || !user) {
        res.render('login', {error: true});
        return;
      }
    }
    req.logIn(user, function (err) {
      if (req.get('ContentType') === 'application/json') {
        if (err) {
          res.status(500).json({error: err.message});
        } else {
          res.json(user);
        }
      } else {
        if (err) {
          res.render('login', { error: true });
        } else {
          res.redirect('/');
        }
      }
    });
  })(req, res, next);
}

function logoutUser(req, res, next) {
  req.session.destroy(function () {
    res.redirect('/');
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

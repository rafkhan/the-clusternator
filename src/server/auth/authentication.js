'use strict';

/*global require, __dirname, module */

// sets up, and initializes authentication
var LocalStrategy = require('passport-local').Strategy,
    HeaderStrategy = require('passport-http-header-token').Strategy,
    Config = require('../../config'),
    passport = require('passport'),
    session = require('express-session'),
    users = require('./users'),
    passwords = require('./passwords');

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
        if (err) {
            res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.sendStatus(401);
        }
        req.logIn(user, function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json(user);
            }
        });
    })(req, res, next);
}

function logoutUser(req, res, next) {
    req.session.destroy(function () {
        next();
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

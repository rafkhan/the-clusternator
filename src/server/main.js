'use strict';

const TEST_VPC = 'vpc-ab07b4cf';
const TEST_ZONE = '/hostedzone/Z1K98SX385PNRP';
const LOGIN_PATH = '/login.html';

var R = require('ramda');
var q = require('q');
var express = require('express');
var bodyParser = require('body-parser');
var aws = require('aws-sdk');

var getPRManager = require('../aws/prManager');

var prHandler = require('./pullRequest');
var pushHandler = require('./push');
var loggers = require('./loggers');

var nodePath = require('path');
var compression = require('compression');
var authentication = require('./auth/authentication');
var authorization = require('./auth/authorization');
var ensureAuth = require('connect-ensure-login').ensureLoggedIn;
var users = require('./auth/users');

function getLoginPage(req, res) {
  res.redirect(200, LOGIN_PATH);
}

function createServer(prManager) {
  var app = express();

  authentication.init(app);

  app.use(compression());
  app.use(express['static'](
    nodePath.normalize(__dirname + nodePath.sep + '..' + nodePath.sep + 'www'))
  );
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  function ping(req, res) {
    res.send('Still alive.');
  }

  // TODO: SSL, auth

  var curriedPushHandler = R.curry(pushHandler)(prManager);
  var curriedPRHandler = R.curry(prHandler)(prManager);

  app.use(loggers.request);

  app.post('/login', authentication.endpoints.login);

  app.put('/users/:id/password', [
    ensureAuth(LOGIN_PATH),
    users.endpoints.password
  ]);

  app.get('/users/:id', [
    ensureAuth(LOGIN_PATH),
    users.endpoints.get
  ]);

  app.get('/ping', ping);
  app.post('/clusternate',
    [
      ensureAuth(LOGIN_PATH),
      curriedPushHandler
    ]); // CI post-build hook
  app.post('/github/pr', [
    ensureAuth,
    curriedPRHandler
  ]);     // github close PR hook

  app.use(loggers.error);

  return app;
}

// XXX
// This function is here to force the PR manager to load asynchronously,
// such that we can query for a VPC ID before starting (as opposed to
// using a hardcoded one right now).
//
function loadPRManagerAsync(config) {
  if (!config.awsCredentials) {
    return q.reject(new Error('No AWS Credentials'));
  }
  var ec2 = new aws.EC2(config.awsCredentials);
  var ecs = new aws.ECS(config.awsCredentials);
  var r53 = new aws.Route53(config.awsCredentials);
  var prm = getPRManager(ec2, ecs, r53, TEST_VPC, TEST_ZONE);
  return q.resolve(prm);
}

function getServer(config) {
  return loadPRManagerAsync(config)
    .then(createServer, (err) => {
      return q.reject(err);
    });
}

function startServer(config) {
  // wtf
  return getServer(config)
    .then((server) => {
      server.listen(config.port);
      console.log('Clusternator listening on port', config.port)
    }, (err) => {

    });
}

module.exports = {
  getServer: getServer,
  startServer: startServer
};

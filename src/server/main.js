'use strict';

const TEST_VPC = 'vpc-ab07b4cf';
const TEST_ZONE = '/hostedzone/Z1K98SX385PNRP';
const LOGIN_PATH = '/login';
const HOST = process.env.HOST;
const PRODUCTION = 'production';
const DEBUG = 'debug';
const NODE_ENV = process.env.NODE_ENV;

const R = require('ramda');
const q = require('q');
const path = require('path');
const express = require('express');
const aws = require('aws-sdk');
const Config = require('../config');
const getPRManager = require('../aws/prManager');
const getDynamoDBManager = require('../aws/dynamoManager');
const waitFor = require('../util').waitFor;
const loggers = require('./loggers');
const log = loggers.logger;
const prHandler = require('./pullRequest');
const pushHandler = require('./push');
const authentication = require('./auth/authentication');
const githubAuthMiddleware = require('./auth/githubHook');
const users = require('./auth/users');
const util = require('../util');
const clusternatorApi = require('./clusternator-api');

var compression = require('compression');
var ensureAuth = require('connect-ensure-login').ensureLoggedIn;

var GITHUB_AUTH_TOKEN_TABLE = 'github_tokens';

var bodyParser = require('body-parser-rawbody');
var lex;

function startSSL(app) {
  if (NODE_ENV === PRODUCTION) {
    log.info('Clusternator SSL set for production');
    lex = require('letsencrypt-express');
  } else if (NODE_ENV === DEBUG) {
    log.info('Clusternator SSL disabled for debug/dev');
    return null;
  } else {
    log.info('Clusternator SSL set for testing');
    lex = require('letsencrypt-express').testing();
  }

  const config = Config();
  /** @todo fetch .private from clusternator.json this might not be valid */
  const configDir = path.join(__dirname, '..', '..', '.private');

  return lex.create({
    configDir,
    onRequest: app,
        approveRegistration: (hostname, cb) => {
          if (!config.hasReadLetsEncryptTOS) {
            return;
          }
          cb(null, {
            domains: [hostname],
            email: config.adminEmail,
            agreeTos: true
          });
        }
    });
}

function createServer(prManager, ddbManager) {
  var app = express(),
    leApp = startSSL(app);

  /**
   *  @todo the authentication package could work with a "mount", or another
   *  mechanism that is better encapsulated
   */
  authentication.init(app);

  app.use(compression());
  app.use(express['static'](
    path.join(__dirname, '..', 'www'))
  );
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  /**
   * @todo the clusternator package could work  with a "mount", or another
   * mechanism that is better encapsulated
   */
  clusternatorApi.init(app);

  function ping(req, res) {
    res.send('Still alive.');
  }

  // TODO: SSL, auth

  var curriedPushHandler = R.curry(pushHandler)(prManager);
  var curriedPRHandler = R.curry(prHandler)(prManager);

  app.use(loggers.request);

  app.set('views', path.join(__dirname, '..', 'views'));
  app.set('view engine', 'ejs');

  app.get('/', [
    ensureAuth(LOGIN_PATH),
    exposeUser,
    (req, res) => {
      res.render('index');
    }]);
  app.get('/logout', [
      authentication.endpoints.logout
    ]
  );
  app.get('/login', (req, res) => {
    res.render('login', { error: false });
  });
  app.post('/login', authentication.endpoints.login);

  app.get('/passwd', [
    ensureAuth(LOGIN_PATH),
    exposeUser,
    (req, res) => {
      res.render('passwd', { error: false });
    }
  ]);

  app.get('/users/:id/tokens', [
    ensureAuth(LOGIN_PATH),
    exposeUser,
    users.endpoints.getTokens
  ]);

  app.post('/users/:id/tokens', [
    ensureAuth(LOGIN_PATH),
    exposeUser,
    users.endpoints.createToken
  ]);

  app.post('/users/:id/password', [
    ensureAuth(LOGIN_PATH),
    users.endpoints.password
  ]);
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
      //ensureAuth(LOGIN_PATH),
      curriedPushHandler
    ]); // CI post-build hook

  var ghMiddleware = githubAuthMiddleware(ddbManager)
  app.post('/github/pr', [
    ghMiddleware,
    curriedPRHandler
  ]);     // github close PR hook

  app.use(loggers.error);

  if (NODE_ENV === DEBUG) {
    return app;
  }
  return leApp;
}

function getAwsResources(config) {
  var creds = config.awsCredentials;

  var ec2 = new aws.EC2(creds);
  var ecs = new aws.ECS(creds);
  var r53 = new aws.Route53(creds);
  var ddb = new aws.DynamoDB(creds);

  return {
    ec2: ec2,
    ecs: ecs,
    r53: r53,
    ddb: ddb
  };
}

// XXX
// This function is here to force the PR manager to load asynchronously,
// such that we can query for a VPC ID before starting (as opposed to
// using a hardcoded one right now).
//
function loadPRManagerAsync(ec2, ecs, r53) {
  var prm = getPRManager(ec2, ecs, r53, TEST_VPC, TEST_ZONE);
  return q.resolve(prm);
}

function createAndPollTable(ddbManager, tableName) {
  log.info('Creating DynamoDB table: %s', tableName);
  return ddbManager.createTable(tableName)
    .then(() => {
      log.info('Waiting for DynamoDB table: %s', tableName);

      return waitFor(() => {
        log.info('Polling...');
        return ddbManager.checkActiveTable(tableName);
      }, 500, 100, 'ddb table create ' + tableName)
    }, q.reject);
}

function initializeDynamoTable(ddbManager, tableName) {
  log.info('Looking for DynamoDB table: %s', tableName);

  return ddbManager.checkTableExistence(tableName)
    .then((exists) => {
      if(exists) {
        log.info('DynamoDB table %s was found',
          tableName);

        return q.resolve();
      } else {
        log.info('DynamoDB table %s was not found',
          tableName);

        return createAndPollTable(ddbManager, tableName);
      }
    }, q.reject)

    .then(() => {
      log.info('Table "' + tableName + '" is active');
    }, q.reject);
}

function exposeUser(req, res, next) {
  if (!req.user) {
    res.locals.username = null;
  }
  res.locals.username = req.user.id;
  next();
}

function getServer(config) {
  var a = getAwsResources(config);

  var ddbManager = getDynamoDBManager(a.ddb);
  var initDynamoTable = R.curry(initializeDynamoTable)(ddbManager);
  var githubAuthTokenTable = ddbManager.tableNames.GITHUB_AUTH_TOKEN_TABLE;

  return initDynamoTable(githubAuthTokenTable)
    .then(() => {
      return loadPRManagerAsync(a.ec2, a.ecs, a.r53)
    }, q.reject)
    .then((prManager) => {
      return createServer(prManager, ddbManager);
    }, q.reject);
}

function startServer(config) {
  return getServer(config)
  .then((server) => {
    if (NODE_ENV === DEBUG) {
      server.listen(config.port);
      log.info(
        `Clusternator listening on port: ${config.port}`);
      } else {
        server.listen([config.port], [config.portSSL]);
        log.info(
          `Clusternator listening on ports: ${config.port}, ${config.portSSL}`);
        }
      }, (err) => {
        log.error(err, err.stack);
      });
}

module.exports = {
  getServer: getServer,
  startServer: startServer
};

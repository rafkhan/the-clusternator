'use strict';

const LOGIN_PATH = '/login';
const PRODUCTION = 'production';
const DEBUG = 'debug';
const NODE_ENV = process.env.NODE_ENV;

const R = require('ramda');
const q = require('q');
const os = require('os');
const path = require('path');
const express = require('express');
const Config = require('../config');
const waitFor = require('../util').waitFor;
const loggers = require('./loggers');
const log = loggers.logger;
const prHandler = require('./pullRequest');
const getProjectManager = require('../aws/project-init');
const instanceReaper = require('../aws/instance-reaper');
const pushHandler = require('./push');
const authentication = require('./auth/authentication');
const githubAuthMiddleware = require('./auth/githubHook');
const users = require('./auth/users');
const util = require('../util');
const clusternatorApi = require('./clusternator-api');
const API = require('../constants').DEFAULT_API_VERSION;

const compression = require('compression');
const ensureAuth = require('connect-ensure-login').ensureLoggedIn;

const bodyParser = require('body-parser-rawbody');
let lex;

function startSSL(app, config) {
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

function hostInfo() {
  log.info(`Initializing Clusternator Server on ${os.hostname()}`);
  log.info(`Platform ${os.type()}/${os.platform()} on ${os.arch()}`);
  log.info(`Freemem: ${os.freemem()}/${os.totalmem()} ` +
    `Cores: ${os.cpus().length}`);
}

function initExpress(app) {
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
  app.use(loggers.request);
}

function createServer(pm, config) {
  hostInfo();
  const app = express();
  const leApp = startSSL(app, config);
  instanceReaper.start();

  initExpress(app);
  /**
   * @todo the clusternator package could work  with a "mount", or another
   * mechanism that is better encapsulated
   */
  clusternatorApi.init(app);
  bindRoutes(app, pm);

  if (NODE_ENV === DEBUG) {
    return app;
  }
  return leApp;
}

function bindRoutes(app, pm) {
  const curriedPushHandler = R.curry(pushHandler)(pm);
  const curriedPRHandler = R.curry(prHandler)(pm);
  const ghMiddleware = githubAuthMiddleware(pm.ddbManager);


  app.set('views', path.join(__dirname, '..', 'views'));
  app.set('view engine', 'ejs');

  app.get('/', [
    (req, res) => {
      res.render('index');
    }]);

  app.get('/logout', [
      authentication.endpoints.logout
    ]
  );
  app.post(`/${API}/login`, authentication.endpoints.login);

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

  app.post('/github/pr', [
    ghMiddleware,
    curriedPRHandler
  ]);     // github close PR hook

  app.use(loggers.error);
}

function createAndPollTable(ddbManager, tableName) {
  log.info('Creating DynamoDB table: %s', tableName);
  return ddbManager.createTable(tableName)
    .then(() => {
      log.info('Waiting for DynamoDB table: %s', tableName);

      return waitFor(() => {
        log.info('Polling...');
        return ddbManager.checkActiveTable(tableName);
      }, 500, 100, 'ddb table create ' + tableName);
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

/**
 * @returns {Q.Promise}
 */
function getServer() {
  const config = Config();
  const pm = getProjectManager(config);
  const ddbManager = pm.ddbManager;
  const initDynamoTable = R.curry(initializeDynamoTable)(ddbManager);
  const githubAuthTokenTable = ddbManager.tableNames.GITHUB_AUTH_TOKEN_TABLE;

  return initDynamoTable(githubAuthTokenTable)
    .then(() => createServer(pm, config));
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

function ping(req, res) {
  res.send('Still alive.');
}

module.exports = {
  getServer: getServer,
  startServer: startServer
};

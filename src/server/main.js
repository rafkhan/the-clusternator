'use strict';
/**
 * The Clusternator server
 *
 * @module server
 */

const TABLES = Object.freeze({
  authorities: 'authorities',
  passwords: 'passwords',
  projects: 'projects',
  tokens: 'tokens'
});
const LOGIN_PATH = '/login';
const DEBUG = 'debug';
const NODE_ENV = process.env.NODE_ENV;

const R = require('ramda');
const Q = require('q');
const os = require('os');
const path = require('path');
const express = require('express');
const Config = require('../config');
const loggers = require('./loggers');
const dbs = require('./db');
const log = loggers.logger;
const prHandler = require('./pull-request');
const getProjectManager = require('../aws/project-init');
const daemons = require('./daemons');
const pushHandler = require('./push');
const authentication = require('./auth/authentication');
const githubAuthMiddleware = require('./auth/github-hook');
const users = require('./auth/users');
const util = require('../util');
const clusternatorApi = require('./clusternator-api');
const API = require('../constants').DEFAULT_API_VERSION;

const compression = require('compression');
const ensureAuth = require('connect-ensure-login').ensureLoggedIn;

const bodyParser = require('body-parser-rawbody');

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

function createDbAccessors(pm, config) {
  return {
    authorities: dbs.authorities
      .createAccessor(pm.hashTable.hashTable(TABLES.authorities), config.dbKey),
    passwords: dbs.passwords
      .createAccessor(pm.hashTable.hashTable(TABLES.passwords), config.dbKey),
    projects: dbs.projects
      .createAccessor(pm.hashTable.hashTable(TABLES.projects), config.dbKey),
    tokens: dbs.tokens
      .createAccessor(pm.hashTable.hashTable(TABLES.tokens), config.dbKey)
  };
}

function createDbs(config, pm) {
  /** @todo implement config name override for tables */
  return Promise.all(Object.keys(TABLES)
    .map((key) => pm.hashTable.create(TABLES[key])()));
}


function createServer(pm, config) {
  hostInfo();
  const app = express();

  return createDbs(config, pm)
    .then(() => createDbAccessors(pm, config))
    .then((dbs) => users.init(dbs)
      .then(() => dbs))
    .then((dbs) => {
      const stopInstanceReaper = daemons.instances(pm);
      const stopProjectsWatch =
        daemons.projects(pm, dbs.projects, config.defaultRepo);

      initExpress(app);
      /**
       * @todo the clusternator package could work  with a "mount", or another
       * mechanism that is better encapsulated
       */
      clusternatorApi.init(app, dbs.projects);
      bindRoutes(app, pm, dbs);

      return app;
    });
}

function bindRoutes(app, pm, dbs) {
  const curriedPushHandler = R.curry(pushHandler)(pm);
  const curriedPRHandler = R.curry(prHandler)(pm);
  const ghMiddleware = githubAuthMiddleware(dbs.projects);


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

function exposeUser(req, res, next) {
  if (!req.user) {
    res.locals.username = null;
  }
  res.locals.username = req.user.id;
  next();
}

/**
 * @returns {Promise}
 */
function getServer() {
  if (NODE_ENV !== 'production') {
    util.info('Enabling Long Stack Support (NOT PRODUCTION)');
    Q.longStackSupport = true;
  }
  const config = Config();
  const pm = getProjectManager(config);

  return createServer(pm, config);
}

function startServer(config) {
  return getServer(config)
    .then((server) => {
      server.listen(config.port);
      log.info(
        `Clusternator listening on port: ${config.port}`);
    }).catch((err) => util.error(`Could not start server ${err.message}`));
}

function ping(req, res) {
  res.send('Still alive.');
}

module.exports = {
  getServer: getServer,
  startServer: startServer
};

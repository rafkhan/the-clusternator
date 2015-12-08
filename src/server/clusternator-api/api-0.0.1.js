'use strict';
const LOGIN_PATH = '/login';
const API = '0.0.1';

var Config = require('../../config'),
  passport = require('passport'),
  R = require('ramda'),
  logger = require('../loggers').logger,
  getCommands = require('./commands-0.0.1'),
  initAwsProject = require('../../aws/project-init'),
  auth = require('../auth/authorities'),
  curryPrivFromNamespace = R.curry(commandPrivFromNamespace);

/**
 * @param {Object} config
 * @param {string} namespace
 * @param {string} command
 * @returns {*}
 */
function commandPrivFromNamespace(config, namespace, command) {
  var cp = config.commandPrivileges;
  if (!cp) {
    return null;
  }
  cp = cp[namespace];
  if (!cp) {
    return null;
  }
  cp = cp[command];
  if (cp === undefined) {
    return null;
  }
  return cp;
}

/**
 * @param {Resource} res
 * @returns {Function}
 */
function getPFail(res) {
  return (err) => {
    res.status(500).json({ error: err });
  }
}

/**
 * @param {Resource} res
 */
function noAuth(res) {
  res.status(401).json({ error: 'Not Authorized'});
}

function authorizeCommand(config) {
  var cmdP = curryPrivFromNamespace(config);

  return (req, res, next) => {
    var ns = req.params.namespace, cmd = req.params.command,
      requiredAuth = cmdP(ns, cmd);

      logger.debug(`Attempting to authorize: ${req.user.id} For: ${ns}.${cmd}`);

      auth.find(req.user.id).then((userAuth) => {
        if (+userAuth.authority <= +requiredAuth) {
          logger.info(`Authorized: ${req.user.id} On: ${ns}.${cmd}`);
          next();
          return;
        }
        logger.warn(`NOT AUTHORIZED: ${req.user.id} On: ${ns}.${cmd}`);
        noAuth(res);
      }).fail(getPFail(res));
  }
}

function executeCommand(commands) {

  return (req, res) => {
    var fn = commands[req.params.namespace];
    if (!fn) {
      getPFail(res)(new Error('Invalid Command'));
      return;
    }
    fn = fn[req.params.command];
    if (typeof fn !== 'function') {
      getPFail(res)(new Error('Invalid Command'));
      return;
    }
    if (!Array.isArray(req.body.params)) {
      req.body.params = [];
    }

    fn(req.body.params).then((output) => {
      if (req.get('ContentType') === 'application/json') {
        res.json(output);
      } else {
        res.redirect('/');
      }
    }).fail(getPFail(res));
  }
}

function getListProjects(commands) {
  return (req, res, next) => {
    commands.projects.list().then((projects) => {
      if (req.get('ContentType') === 'application/json') {
        res.json(projects);
      } else {
        res.render('projects', { api: API, projects: projects });
      }
    }, getPFail(res))
  }
}

function getProject(commands) {
  return (req, res, next) => {
    commands.projects.list().then((projects) => {
      if (projects.indexOf(req.params.project) === -1) {
        res.status(404).json({ error: req.params.project + ' not found' });
        return;
      }
      if (req.get('ContentType') === 'application/json') {
        res.json(req.params.project);
      } else {
        res.render('project', {api: API, project: req.params.project});
      }
    }, getPFail(res));
  }
}

function authSwitch(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    passport.authenticate(['auth-header'],
      { failureRedirect: LOGIN_PATH})(req, res, next);
  }
}

function init(app) {
  var config = Config();
  logger.debug(`API ${API} Initializing`);

  getCommands(config).then((commands) => {
    logger.debug(`API ${API} Got CommandObjects`);
    app.get(`/${API}/projects`, [
      authSwitch,
      getListProjects(commands)
    ]);
    app.get(`/${API}/projects/:project`, [
      authSwitch,
      getProject(commands)
    ]);
    app.post(`/${API}/:namespace/:command`, [
      authSwitch,
      authorizeCommand(config),
      executeCommand(commands)
    ]);
  });

  return initAwsProject(config);
}

module.exports = {
  init
};

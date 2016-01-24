'use strict';
const LOGIN_PATH = '/login';

const constants = require('../../constants');
const API = constants.DEFAULT_API_VERSION;

const passport = require('passport');
const R = require('ramda');

const Config = require('../../config');
const logger = require('../loggers').logger;
var getCommands = require('../../api')[API].rest;
var initAwsProject = require('../../aws/project-init');
var auth = require('../auth/authorities');
var curryPrivFromNamespace = R.curry(commandPrivFromNamespace);

module.exports = {
  init
};

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
    res.status(500).json({ error: err.message });
  };
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
  };
}

function executeCommand(commands) {

  return (req, res) => {
    logger.info('Attempting To Execute Command', req.params.namespace,
      req.params.command);
    var fn = commands[req.params.namespace];
    if (!fn) {
      getPFail(res)(new Error('Invalid Command (bad namespace)'));
      return;
    }
    fn = fn[req.params.command];
    if (typeof fn !== 'function') {
      getPFail(res)(new Error('Invalid Command (bad function)'));
      return;
    }

    logger.info('executing command', req.params.namespace, req.params.command);
    fn(req.body)
      .then((output) => res.json(output))
      .fail(getPFail(res));
  };
}


function authSwitch(req, res, next) {
  if (req.params.namespace === 'pr') {
    console.log('DEBUG');
    console.log('DEBUG');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('DEBUG');
    console.log('DEBUG');
  }
  if (req.isAuthenticated()) {
    next();
  } else {
    passport.authenticate(['auth-header'],
      { failureRedirect: LOGIN_PATH})(req, res, next);
  }
}

function init(app) {
  const config = Config();
  logger.debug(`API ${API} Initializing`);

  const commands = getCommands(config)
  logger.debug(`API ${API} Got CommandObjects`);
  app.post(`/${API}/:namespace/:command`, [
    authSwitch,
    authorizeCommand(config),
    executeCommand(commands)
  ]);

  return initAwsProject(config);
}


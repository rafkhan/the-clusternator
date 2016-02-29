'use strict';
/**
 * Authentication layer/execution layer that sits between {@link module:server}
 * and {@link module:api/'0.1'/rest}
 *
 * @module server/'api-0.1'
 */

const constants = require('../../constants');
const API = constants.DEFAULT_API_VERSION;

const passport = require('passport');
const R = require('ramda');

const Config = require('../../config');
const logger = require('../loggers').logger;
const getCommands = require(`../../api/${API}/rest/rest-api`);
const users = require('../auth/users');
const curryPrivFromNamespace = R.curry(commandPrivFromNamespace);

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
  let cp = config.commandPrivileges;
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
  if (process.env.NODE_ENV === 'production') {
    return (err) => {
      res.status(500).json({ error: err.message });
    };
  }
  return (err) => {
    res.status(500).json({
      debugMode: true,
      error: err.message + 'stack: ' + err.stack });
  };
}

/**
 * @param {Resource} res
 */
function noAuthority(res) {
  res.status(403).json({ error: 'Not Authorized'});
}

function authorizeCommand(config) {
  const cmdP = curryPrivFromNamespace(config);

  return (req, res, next) => {
    const ns = req.params.namespace;
    const cmd = req.params.command;
    const requiredAuth = cmdP(ns, cmd);

      logger.debug(`Attempting to authorize: ${req.user.id} For: ${ns}.${cmd}`);

      users.find(req.user.id).then((userAuth) => {
        if (+userAuth.authority <= +requiredAuth) {
          logger.info(`Authorized: ${req.user.id} On: ${ns}.${cmd}`);
          next();
          return;
        }
        logger.warn(`NOT AUTHORIZED: ${req.user.id} On: ${ns}.${cmd}`);
        noAuthority(res);
      }).fail(getPFail(res));
  };
}

function executeCommand(commands) {

  return (req, res) => {
    logger.info('Attempting To Execute Command', req.params.namespace,
      req.params.command, req.body);

    if (!commands[req.params.namespace]) {
      getPFail(res)(new Error('Invalid Command (bad namespace)'));
      return;
    }
    const fn = commands[req.params.namespace][req.params.command];

    if (typeof fn !== 'function') {
      getPFail(res)(new Error('Invalid Command (bad function)'));
      return;
    }

    logger.info('executing command', req.params.namespace, req.params.command,
      req.body);

    fn(req.body)
      .then((output) => res.json(output))
      .fail(getPFail(res));
  };
}

function init(app, projectDb) {
  const config = Config();
  logger.debug(`API ${API} Initializing`);

  const commands = getCommands(config, projectDb);
  logger.debug(`API ${API} Got CommandObjects`);

  app.post(`/${API}/:namespace/:command`, [
    passport.authenticate(['auth-header']),
    authorizeCommand(config),
    executeCommand(commands)
  ]);
}

'use strict';
const LOGIN_PATH = '/login';

var Config = require('../../config'),
  logger = require('../loggers'),
  initAwsProject = require('../../aws/project-init'),
  ensureAuth = require('connect-ensure-login').ensureLoggedIn;


function authorizeCommand(req, res) {
  console.log('BOOOOOOOOO');
  res.status(404);
}

function init(app) {

  app.post('/0.0.1/:command', [
    ensureAuth(LOGIN_PATH),
    authorizeCommand
  ]);


  return initAwsProject(Config());
}

module.exports = {
  init
};
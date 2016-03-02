'use strict';
/**
 * Handler for GitHub pull request events
 *
 * @module server/gitHubPullRequest
 */

const R = require('ramda');

const serverUtil = require('../util');
const log = require('../loggers').logger;

let pullRequest = require('./pull-request');

module.exports = gitHubRouteHandler;

function gitHubRouteHandler(pm, req, res) {
  const error = R.curry(serverUtil.sendError)(res);

  const ghEventType = req.header('X-Github-Event');

  if (ghEventType === 'ping') {
    log.info('GitHub Ping Request');
    res.sendStatus(200);
    return;
  }
  if (ghEventType === 'pull_request') {
    log.info('GitHub Pull Request Event');
    return pullRequest(pm, req, res);
  }
  error(405, 'Pull requests and pings only!');
}


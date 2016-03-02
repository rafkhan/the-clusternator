'use strict';
/**
 * Handler for GitHub pull request events
 *
 * @module server/gitHubPullRequest
 */

const R = require('ramda');

const util = require('../util');
const serverUtil = require('./util');
const log = require('./loggers').logger;

function writeSuccess(res, result) {
  log.info('PR close success:', result);
  res.send(':)');
}

function writeFailure(res, err) {
  log.error(err.stack);
  res.status(500);
  res.send(err);
}

// Extracts relevant data from github webhook body
function getPRInfo(body) {
  const prBody = body.pull_request;
  const number = prBody.number;
  const name = prBody.head.repo.name;

  return {
    number: number,
    name:   name
  };
}

function onPrClose(pm, body) {
  const pr = getPRInfo(body);
  return pm.destroyPR(pr.name, pr.number);
}

function pullRequestRouteHandler(pm, req, res) {
  const error = R.curry(serverUtil.sendError)(res);

  const body = req.body;

  const onSuccess = R.curry(writeSuccess)(res);
  const onFail   = R.curry(writeFailure)(res);

  const ghEventType = req.header('X-Github-Event');

  if(ghEventType !== 'pull_request') {
    error(405, 'Pull requests only!');
    return;
  }

  const ghAction = body.action;

  if(ghAction === 'closed') {
    onPrClose(pm, body)
      .then(onSuccess, onFail);
  } else {
    error(403, 'We only want "closed" PR events right now.');
  }
}


module.exports = pullRequestRouteHandler;

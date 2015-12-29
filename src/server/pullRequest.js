'use strict';

const R = require('ramda');

var serverUtil = require('./util');
var log = require('./loggers').logger;

function writeSuccess(res, result) {
  log.info('PR close success:', result);
  res.send(':)');
}

function writeFailure(res, err) {
  log.error(err.stack);
  res.status(500);
  res.send(err);
  return;
}

// Extracts relevant data from github webhook body
function getPRInfo(body) {
  var prBody = body['pull_request'];
  var number = prBody.number;
  var name = prBody.head.repo.name;

  return {
    number: number,
    name:   name
  };
}

function onPrClose(prManager, body) {
  var pr = getPRInfo(body);
  return prManager.destroy(pr.name, pr.number);
}

function pullRequestRouteHandler(prManager, req, res) {
  var error = R.curry(serverUtil.sendError)(res);

  var body = req.body;

  var onSuccess = R.curry(writeSuccess)(res);
  var onFail   = R.curry(writeFailure)(res);

  var ghEventType = req.header('X-Github-Event')

  if(ghEventType !== 'pull_request') {
    error(403, 'Pull requests only!');
    return;
  }

  var ghAction = body.action;

  if(ghAction === 'closed') {
    onPrClose(prManager, body)
      .then(onSuccess, onFail);
  } else {
    error(403, 'We only want "closed" PR events right now.');
    return;
  }
}


module.exports = pullRequestRouteHandler;

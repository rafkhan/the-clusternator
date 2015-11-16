'use strict';

var Q = require('q')
var R = require('ramda');

var serverUtil = require('./util');

function writeSuccess(res, result) {
  res.send(':)');
}

function writeFailure(res, err) {
  res.send(':(');
}

// Extracts relevant data from github webhook body
function getPRInfo(body) {
  var prBody = body['pull_request'];
  var number = prBody.number;
  var name = prBody.repository.name;

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

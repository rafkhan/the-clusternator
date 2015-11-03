'use strict';

var Q = require('q')
var R = require('ramda');

var serverUtil = require('./util');


function onPrClose() {
  return Q.resolve();
}

function writeSuccess(res, result) {
  res.send(':)');
}

function writeFailure(res, err) {
  res.send(':(');
}

function pullRequestRouteHandler(req, res) {
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
    onPrClose(body)
      .then(onSuccess, onFail);
  } else {
    error(403, 'We only want "closed" PR events right now.');
    return;
  }
}


module.exports = pullRequestRouteHandler;

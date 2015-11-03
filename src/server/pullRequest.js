'use strict';

var Q = require('q')
var R = require('ramda');


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
  var body = req.body;

  var onSuccess = R.curry(writeSuccess)(res);
  var onFail   = R.curry(writeFailure)(res);

  var ghEventType = req.header('X-Github-Event')

  if(ghEventType !== 'pull_request') {
    res.status(403)
       .send('Pull requests only!');
    return;
  }

  var ghAction = body.action;

  if(ghAction === 'closed') {
    onPrClose(body)
      .then(onSuccess, onFail);
  } else {
    res.status(403)
       .send('We only want "closed" PR events right now.');
    return;
  }
}


module.exports = pullRequestRouteHandler;

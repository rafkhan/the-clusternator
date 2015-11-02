'use strict';

var R = require('ramda');


function onPrClose() {
  return q.resolve();
}

function writeSuccess(res, result) {
  res.send(':)');
}

function writeFailure(res, err) {
  res.send(':(');
}

function pullRequestRouteHandler(req, res) {
  var body = req.body;

  var onSucess = R.curry(writeSuccess)(res);
  var onFail   = R.curry(writeFailure)(res);

  var ghAction = body.action;
  var ghEventType = req.header('X-Github-Event')

  if(ghEventType !== 'pull_request') {
    res.status(403)
       .send('Pull requests only!');
  }

  if(ghAction === 'closed') {
    onPrClose(body)
      .then(onSuccess, onFail);
  } else {
    res.status(403)
       .send('We only want "closed" PR events right now.');
  }
}


module.exports = pullRequestRouteHandler;

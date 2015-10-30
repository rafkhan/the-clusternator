'use strict';

function onPrClose() {}

function writeSuccess(res, result) {
  res.send(':)');
}

function writeFailure(res, err) {
  res.send(':(');
}

function pullRequestRouteHandler(req, res) {
  var body = req.body;

  var onSucess = R.curry(writeSuccess, res);
  var onFail = R.curry(writeFailure, res);

  if (body.action === 'closed') {
    onPrClose(body).then(onSuccess, onFail);
  }
}

module.exports = pullRequestRouteHandler;
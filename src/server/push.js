'use strict';

var R = require('ramda');

var serverUtil = require('./util');

var missingPropertyStatus = 400;

function pushHandler(req, res) {
  var error = R.curry(serverUtil.sendError)(res);

  var body = req.body;

  // essential
  var appdef = body.appdef;
  var tag = body.tag;

  if(!tag) {
    error(missingPropertyStatus,
          '"tag" required for project identification.');
  }

  if(!appdef) {
    error(missingPropertyStatus,
          '"appdef" required to instantiate cluster.');
  }

  var resp = JSON.stringify({
    appdef: appdef,
    tag: tag
  }, null, 2);

  res.send(resp);
}

module.exports = pushHandler;

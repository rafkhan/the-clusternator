'use strict';

var R = require('ramda');

var serverUtil = require('./util');
var resourceId = require('../resourceIdentifier');

var missingPropertyStatus = 400;

function pushHandler(prManager, req, res) {
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

  var parsedAppdef = JSON.parse(appdef);
  var parsedTag = resourceId.parseRID(tag);

  prManager.create(parsedTag.pid, parsedTag.pr, parsedAppdef)
    .then((res) => { console.log('PR manager created build successfully', res); },
          (err) => { console.log('Error creating PR build:', err.stack); });

  var resp = JSON.stringify({
    appdef: appdef,
    tag: tag
  }, null, 2);

  res.send(resp);
}

module.exports = pushHandler;

'use strict';

var serverUtil = require('./util');

var missingPropertyStatus = 400;

function pushHandler(req, res) {
  var error = R.curry(serverUtil.sendError)(res);

  var body = req.body;

  // essential
  var repo = body.repo;
  var appdef = body.appdef;
  // non essential
  var sha = body.sha;
  var prNumber = body.pr;

  if(!repo) {
    error(missingPropertyStatus,
          '"repo" required for project identification.');
  }

  if(!appdef) {
    error(missingPropertyStatus,
          '"appdef" required to instantiate cluster.');
  }
  
  // Initiate building box
}

module.exports = pushHandler;

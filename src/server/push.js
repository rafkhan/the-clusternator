'use strict';

function pushHandler(req, res) {
  var body = req.body;

  var repo = body.repo;
  var sha = body.sha;
  var appdef = body.appdef;
  var prNumber = body.pr;
  
  // Initiate building box
}

module.exports = pushHandler;

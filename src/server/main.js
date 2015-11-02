'use strict';

var express = require('express');
var bodyParser = require('body-parser');

var prHandler = require('./pullRequest');


function getServer(config) {
  var app = express();

  // SSL
  // Auth

  app.use(bodyParser.json());

  app.get('/ping', function (req, res) {
    res.send('Still alive.');
  });

  app.post('/clusternate', (req, res) => {
    var body = req.body;

    var repo = body.repo;
    var sha = body.sha;
    var appdef = body.appdef;
    var prNumber = body.pr;
    
    // Initiate building box
  });

  // Git hook
  app.post('/github/pr', prHandler);

  return app;
}

function startServer(config) {
  // wtf
  getServer(config).listen(config.port);
  console.log('Clusternator listening on port', config.port)
}

module.exports = {
  getServer: getServer,
  startServer: startServer
};

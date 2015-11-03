'use strict';

var express = require('express');
var bodyParser = require('body-parser');

var prHandler = require('./pullRequest');
var pushHandler = require('./push');

function getServer(config) {
  var app = express();

  // SSL
  // Auth

  app.use(bodyParser.json());

  app.get('/ping', function (req, res) {
    res.send('Still alive.');
  });

  app.post('/clusternate', pushHandler); // CI post-build hook
  app.post('/github/pr', prHandler);     // github close PR hook

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

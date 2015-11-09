'use strict';

var express = require('express');
var bodyParser = require('body-parser');

var prHandler = require('./pullRequest');
var pushHandler = require('./push');
var loggers = require('./loggers');

function getServer(config) {
  var app = express();

  function ping(req, res) {
    res.send('Still alive.');
  }

  // SSL
  // Auth

  app.use(bodyParser.json());
  app.use(loggers.request);

  app.post('/clusternate', pushHandler); // CI post-build hook
  app.post('/github/pr', prHandler);     // github close PR hook

  app.use(loggers.error);

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

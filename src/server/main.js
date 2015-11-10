'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var winston = require('winston');
var expressWinston = require('express-winston');

var prHandler = require('./pullRequest');
var pushHandler = require('./push');

function getServer(config) {
  var app = express();

  // SSL
  // Auth

  app.use(bodyParser.json());

  app.use(expressWinston.logger({
    transports: [
      new winston.transports.Console({
        json: true,
        colorize: true
      })
    ],
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: true,
    colorStatus: true
  }));


  app.get('/ping', function (req, res) {
    res.send('Still alive.');
  });

  app.post('/clusternate', pushHandler); // CI post-build hook
  app.post('/github/pr', prHandler);     // github close PR hook


  app.use(expressWinston.errorLogger({
    transports: [
      new winston.transports.Console({
        json: true,
        colorize: true
      })
    ]
  }));

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

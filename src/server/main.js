'use strict';

var express = require('express');
var bodyParser = require('body-parser')

//var config= require('../config');
//config.init();


function getServer(config) {
  var app = express();

  // SSL
  // Auth
  //

  app.use(bodyParser.json());

  app.get('/ping', function(req, res) {
    res.send('Still alive.');
  });

  app.post('/clusternate', function(req, res) {
     
  });

  return app;
}

function startServer(config) {
  getServer(config).listen(8080);
}

module.exports = {
  getServer: getServer,
  startServer: startServer
};

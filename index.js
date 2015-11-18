'use strict';

var server = require('./src/server/main'),
  config = require('./src/config')();

server.startServer(config);


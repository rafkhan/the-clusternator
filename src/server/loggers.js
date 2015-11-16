'use strict';

var winston = require('winston');
var expressWinston = require('express-winston');

var requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    })
  ],
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorStatus: true
});

var errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    })
  ]
});

module.exports = {
  request: requestLogger,
  error: errorLogger
};

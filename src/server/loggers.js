'use strict';

var winston = require('winston');
var expressWinston = require('express-winston');
var logLevelsByLogger = {
  request: 0,
  error: 0,
  logger: 0
};

switch (process.env.NODE_ENV) {
  case 'debug':
    logLevelsByLogger.logger = 'debug';
    break;
  case 'production':
    logLevelsByLogger.logger = 'info';
    break;
}

var requestLogger = expressWinston.logger({
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
});

var errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    })
  ]
});

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: logLevelsByLogger.logger,
      timestamp: function() {
        return Date.now();
      },
      formatter: function(options) {
        // Return string will be passed to logger.
        return options.timestamp() +' '+ options.level.toLowerCase() + ': '+ (undefined !== options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
      }
    })
  ]
});



module.exports = {
  request: requestLogger,
  error: errorLogger,
  logger: logger
};

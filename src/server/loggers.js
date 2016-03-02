'use strict';
/**
 * Logger configuration for The Clusternator server
 *
 * @module server/loggers
 */

const winston = require('winston');
const expressWinston = require('express-winston');
const logLevelsByLogger = {
  request: 0,
  error: 0,
  logger: 0
};
const humanTimestamp = () => (new Date()).toISOString();

switch (process.env.NODE_ENV) {
  case 'debug':
    logLevelsByLogger.logger = 'debug';
    break;
  case 'production':
    logLevelsByLogger.logger = 'info';
    break;
}

const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.Console({
      timestamp: humanTimestamp,
      json: true,
      colorize: true
    })
  ],
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorStatus: true
});

const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    })
  ]
});

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: logLevelsByLogger.logger,
      timestamp: humanTimestamp,
      formatter: (options) => {
        const prefix =
          options.timestamp() + ' ' + options.level.toLowerCase() + ': ';

        const optionalMessage = options.message ? options.message : '';

        const meta = (options.meta && Object.keys(options.meta).length ?
          '\n\t'+ JSON.stringify(options.meta) : '' );

        return prefix + optionalMessage + meta;
      }
    })
  ]
});


module.exports = {
  request: requestLogger,
  error: errorLogger,
  logger: logger
};

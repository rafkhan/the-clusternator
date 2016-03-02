'use strict';
/**
 * Utility functions for the clusternator server
 *
 * @module server/util
 */

const log = require('./loggers').logger;

function sendError(res, status, message) {
  log.error(status, message);
  res.status(status).json({error: message});
}

module.exports = {
  sendError: sendError
};

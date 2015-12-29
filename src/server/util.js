'use strict';

const log = require('./loggers').logger;

function sendError(res, status, message) {
  log.error(status, message);
  res.status(status).send({error: message});
}

module.exports = {
  sendError: sendError
};

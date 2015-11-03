'use strict';

function sendError(res, status, message) {
  res.status(status).send({error: message});
}

module.exports = {
  sendError: sendError
};

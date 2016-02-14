'use strict';
/**
 * This module provides shortcuts to a slack post script located in
 * `the-clusternator/bin`
 *
 * @module childProcess/slack
 */

const path = require('path');
const config = require('../config')();

let cproc = require('./child-process');

const COMMAND = path.join(__dirname, '..', '..', 'bin', 'slack-hook.sh');

function message(message, channel) {
  if (!message || !channel) {
    throw new TypeError('Slack messages require a message, and channel');
  }

  return cproc.output(COMMAND, [message, channel, config.slackURI]);
}

module.exports = {
  message
};

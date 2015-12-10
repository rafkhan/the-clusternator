
var spawn = require('child_process').spawn,
  path = require('path'),
  config = require('../config')(),
  Q = require('q');

const COMMAND = path.join(__dirname, '..', '..', 'bin', 'slack-hook.sh');

function message(message, channel) {
  if (!message || !channel) {
    throw new TypeError('Slack messages require a message, and channel');
  }
  var d = Q.defer(),
    sshKeygen = spawn(COMMAND, [message, channel, config.slackURI]);

  sshKeygen.on('close', (code) => {
    if (+code) {
      d.reject(new Error('Slack terminated with exit code: ' + code));
    } else {
      d.resolve();
    }
  });

  return d.promise;
}

module.exports = {
  message
};

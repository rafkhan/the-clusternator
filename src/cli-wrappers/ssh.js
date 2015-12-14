'use strict';

const COMMAND = 'ssh';
const FLAG_DOCKER = 'docker';
const FLAG_PS = 'ps';
const FLAG_LOGS = 'logs';
const FLAG_FOLLOW = '--follow';

var spawn = require('child_process').spawn,
  fs = require('fs'),
  Q = require('q');

/**
 * @returns {Q.Promise}
 */
function sshPs() {
  var d = Q.defer(),
    ssh = spawn(COMMAND, [FLAG_DOCKER, FLAG_PS]),
    output = '', error = '';

  ssh.stdout.setEncoding('utf8');
  ssh.stderr.setEncoding('utf8');

  ssh.stdout.on('data', (data) => {
    output += 'data';
  });

  ssh.stderr.on('data', (data) => {
    error += data;
  });

  ssh.on('close', (code) => {
    if (+code) {
      d.reject(new Error('npm terminated with exit code: ' + code));
    } else {
      d.resolve(output);
    }
  });

  ssh.stdin.end();

  return d.promise;
}

function sshLogs(id) {
  var d = Q.defer(),
    ssh = spawn(COMMAND, [FLAG_DOCKER, FLAG_LOGS, FLAG_FOLLOW, id]);

  ssh.stdout.setEncoding('utf8');
  ssh.stderr.setEncoding('utf8');

  ssh.stdout.on('data', (data) => {
    d.notify({ data: data });
  });

  ssh.stderr.on('data', (data) => {
    d.notify({ error: data });
  });

  ssh.on('close', (code) => {
    if (+code) {
      d.reject(new Error('npm terminated with exit code: ' + code));
    } else {
      d.resolve();
    }
  });

  ssh.stdin.end();

  return d.promise;
}

module.exports = {
  sshPs,
  sshLogs
};
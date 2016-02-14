'use strict';
/**
 * This module contains a variety of generic promise wrapped
 `node.child_process.spawn` commands

 * @module childProcess
 */

const R = require('ramda');
const Q = require('q');

/** this is not a constant for unit testing purposes */
let spawn = require('child_process').spawn;

const util = require('../util');

module.exports = {
  output,
  quiet,
  stream,
  inherit,
  stdin
};

/**
 * @param {string} command
 * @param {string} args
 * @returns {string}
 */
function commandStr(command, args) {
  return `${command} ${args.join(' ')}`;
}

/**
 * @param {string} command
 * @param {string} args
 * @param {string|number} code
 * @returns {string}
 */
function successString(command, args, code) {
  return `${commandStr(command, args)}   Process Exited: ${code}`;
}

/**
 * @param {string} command
 * @param {string} args
 * @param {string|number} code
 * @param {string=} stderr
 * @returns {string}
 */
function failString(command, args, code, stderr) {
  stderr = stderr || '';
  return `${commandStr(command, args)} terminated with exit code: ${code} ` +
    stderr;
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {number} code
 * @param {string=} stderr
 * @returns {Error}
 */
function failError(command, args, code, stderr) {
  util.verbose('Failed: ', command, args, code, stderr);

  code = parseInt(code, 10);
  stderr = stderr || '';

  const errString = failString(command, args, code, stderr);
  const e = new Error(errString);
  e.code = code;

  return e;
}

/**
 * Resolves stdout, rejects with stderr, also streams
 * @param {string} command
 * @param {Array.<string>=} args
 * @param {Object=} opts
 * @returns {Promise<string>}
 */
function output(command, args, opts) {
  args = args || [];
  const options = R.merge({}, opts);
  const d = Q.defer();
  const child = spawn(command, args, options);

  let stdout = '';
  let stderr = '';

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  child.stdout.on('data', (data) => {
    d.notify({ stdout: data });
    stdout += data;
  });

  child.stderr.on('data', (data) => {
    d.notify({ stderr: data });
    stderr += data;
  });

  child.on('close', (code) => {
    if (+code) {
      d.reject(failError(command, args, code, stderr));
    } else {
      util.verbose(successString(command, args, code));
      d.resolve(stdout.trim());
    }
  });

  child.stdin.end();

  return d.promise;
}

/**
 * Does not resolve stdout, but streams, and resolves stderr
 * @param {string} command
 * @param {Array.<string>=} args
 * @param {Object=} opts
 * @returns {Promise}
 */
function quiet(command, args, opts) {
  args = args || [];
  const options = R.merge({}, opts);
  const d = Q.defer();
  const child = spawn(command, args, options);
  let stderr = '';

  child.stderr.setEncoding('utf8');

  child.stdout.on('data', (data) => {
    d.notify({ stdout: data });
  });

  child.stderr.on('data', (data) => {
    d.notify({ stderr: data });
    stderr += data;
  });

  child.on('close', (code) => {
    if (+code) {
      d.reject(failError(command, args, code, stderr));
    } else {
      util.verbose(successString(command, args, code));
      d.resolve();
    }
  });

  child.stdin.end();

  return d.promise;
}

/**
 * Only streams stdout/stderr, no output on resolve/reject
 * @param {string} command
 * @param {Array.<string>=} args
 * @param {Object=} opts
 * @returns {Promise}
 */
function stream(command, args, opts) {
  args = args || [];
  const options = R.merge({}, opts);
  const d = Q.defer();
  const child = spawn(command, args, options);

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  child.stdout.on('data', (data) => {
    d.notify({ data: data });
  });

  child.stderr.on('data', (data) => {
    d.notify({ error: data });
  });

  child.on('close', (code) => {
    if (+code) {
      d.reject(failError(command, args, code));
    } else {
      util.verbose(successString(command, args, code));
      d.resolve();
    }
  });

  child.stdin.end();

  return d.promise;
}

/**
 * Stdio inherits, meaning that the given command takes over stdio
 * @param {string} command
 * @param {Array.<string>=} args
 * @param {Object=} opts
 * @returns {Promise}
 */
function inherit(command, args, opts) {
  args = args || [];
  const options = R.merge({
      stdio: 'inherit'
    }, opts);
  const d = Q.defer();
  const child = spawn(command, args, options);

  child.on('close', (code) => {
    if (+code) {
      d.reject(failError(command, args, code));
    } else {
      util.verbose(successString(command, args, code));
      d.resolve();
    }
  });

  return d.promise;
}

/**
 * like output, but puts stdin in as stdin
 * @param {string} stdin
 * @param {string} command
 * @param {Array.<string>=} args
 * @param {Object=} opts
 * @returns {Promise<string>}
 */
function stdin(stdin, command, args, opts) {
  stdin = stdin || '';
  args = args || [];
  const options = R.merge({}, opts);
  const d = Q.defer();
  const child = spawn(command, args, options);

  let stderr = '';
  let stdout = '';

  child.stdout.on('data', (data) => {
    d.notify({ stdout: data });
    stdout += data;
  });

  child.stderr.on('data', (data) => {
    d.notify({ stderr: data });
    stderr += data;
  });

  child.on('close', (code) => {
    if (+code) {
      d.reject(failError(command, args, code, stderr));
    } else {
      d.resolve(stdout);
    }
  });

  child.stdin.write(stdin);
  child.stdin.end();

  return d.promise;
}

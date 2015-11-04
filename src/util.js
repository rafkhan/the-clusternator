'use strict';

var q = require('q');

function errLog(x) {
  console.log('ERROR', x);
  return q.reject(x);
}

function plog() {
  console.log.apply(null, arguments);
  return arguments[0];
}

function quote(str) {
  return '"' + str + '"';
}

module.exports = {
  errLog: errLog,
  plog: plog,
  quote: quote
};

'use strict';

var q = require('q');

function errLog(x) {
  console.log('ERROR', x);
  return q.reject(x);
}

function plog(x) {
  console.log(x);
  return x;
}

function quote(str) {
  return '"' + str + '"';
}

module.exports = {
  errLog: errLog,
  plog: plog,
  quote: quote
};
'use strict';

var q = require('Q');

function errLog(x) {
  console.log('ERROR', x);
  return q.reject(x);
}

function plog(x) {
  console.log(x);
  return x;
}

module.exports = {
  errLog: errLog,
  plog: plog
};

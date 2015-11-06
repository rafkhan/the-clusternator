'use strict';

var q = require('q');

function errLog(x) {
  console.log('ERROR', x);
  return q.reject(new Error(x));
}

function plog() {
  console.log.apply(null, arguments);
  return arguments[0];
}

function quote(str) {
  return '"' + str + '"';
}

/**
@param {string} ip '1.2.3.0/24'
@return {string} '1.2'
*/
function getCidrPrefixFromIPString(ip) {
  var classes = ip.split('.');
  return classes[0] + '.' + classes[1];
}

module.exports = {
  errLog: errLog,
  plog: plog,
  quote: quote,
  getCidrPrefixFromIPString
};

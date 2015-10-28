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

function makeAWSFilter(key, value) {
  /** @todo make this actually flexible wrt plural values */
  return [
      {
        Name: key,
        Values: [value]
      }
  ];
}

function makeAWSVPCFilter(value) {
  return makeAWSFilter('vpc-id', value);
}

module.exports = {
  errLog: errLog,
  plog: plog,
  quote: quote,
  makeAWSFilter: makeAWSFilter,
  makeAWSVPCFilter: makeAWSVPCFilter
};

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
  return [{
    Name: key,
    Values: [value]
  }];
}

function makeAWSVPCFilter(value) {
  return makeAWSFilter('vpc-id', value);
}

function awsTagEc2(ec2, resourceId, tags) {
  return q.nbind(ec2.createTags, ec2)({
    Resources: [resourceId],
    Tags: tags
  });
}

module.exports = {
  errLog: errLog,
  plog: plog,
  quote: quote,
  awsTagEc2: awsTagEc2,
  makeAWSFilter: makeAWSFilter,
  makeAWSVPCFilter: makeAWSVPCFilter
};
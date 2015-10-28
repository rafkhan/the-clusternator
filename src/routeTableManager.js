'use strict';

var aws = require('aws-sdk'),
constants = require('constants'),
Q = require('q');

var ec2 = new aws.EC2({apiVersion: '2015-10-01'});

function listRouteTables(vpcId) {
  var d = Q.defer();
  ec2.describeRouteTables({
    DryRun: false,
    'vpc-id': vpcId,
    Filters: [
      { 'tag-key': constants.CLUSTERNATOR_TAG }
    ]
  }, function (err, list) {
    if (err) {
      d.reject(err);
      return;
    }
    d.resolve(list);
  });
  return d.promise;
}

module.exports = {
  list: listRouteTables
};

'use strict';

var aws = require('aws-sdk'),
Q = require('q');

var ec2 = new aws.EC2({apiVersion: '2015-10-01'});

function listSubnets(vpcId) {
  var d = Q.defer();
  ec2.describeSubnets({
    DryRun: false,
    'vpc-id': vpcId
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
  list: listSubnets
};

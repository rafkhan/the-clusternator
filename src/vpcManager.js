'use strict';

var aws = require('aws-sdk'),
Q = require('q');

var ec2 = new aws.EC2({apiVersion: '2015-10-01'});

function listClusterVPCs() {
  var d = Q.defer();
  /** @todo add filter here for VPC name convention */
  ec2.describeVpcs({
    DryRun: false
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
  list: listClusterVPCs
};

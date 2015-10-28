'use strict';

var constants = require('constants'),
Q = require('q');

function listRouteTables(ec2, vpcId) {
  var d = Q.defer();
  ec2.describeRouteTables({
    DryRun: false,
    'vpc-id': vpcId,
    Filters: constants.AWS_FILTER_CTAG
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

'use strict';

var Q = require('q'),
constants = require('./constants');

function listSubnets(ec2, vpcId) {
  var d = Q.defer();
  ec2.describeSubnets({
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
  list: listSubnets
};

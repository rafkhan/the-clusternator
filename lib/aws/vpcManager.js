'use strict';

var Q = require('q'),
    constants = require('../constants');

function listClusterVPCs(ec2) {
  var d = Q.defer();
  /** @todo add filter here for VPC name convention */
  ec2.describeVpcs({
    DryRun: false,
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
  list: listClusterVPCs
};
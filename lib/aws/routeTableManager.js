'use strict';

var Q = require('q'),
    constants = require('../constants'),
    util = require('../util');

function listRouteTables(ec2, vpcId) {
  var d = Q.defer();
  ec2.describeRouteTables({
    DryRun: false,
    Filters: constants.AWS_FILTER_CTAG.concat(util.makeAWSVPCFilter(vpcId))
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
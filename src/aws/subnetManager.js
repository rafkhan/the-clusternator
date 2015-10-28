'use strict';

var Q = require('q'),
util = require('../util'),
constants = require('../constants');

function listSubnets(ec2, vpcId) {
  var d = Q.defer();
  ec2.describeSubnets({
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
  list: listSubnets
};

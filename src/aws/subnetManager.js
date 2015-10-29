'use strict';

var Q = require('q'),
util = require('../util'),
constants = require('../constants');

function getSubnetManager(ec2, vpcId) {
    var describeSubnets = Q.nfbind(ec2.describeSubnets, {
    DryRun: false,
    Filters: constants.AWS_FILTER_CTAG.concat(util.makeAWSVPCFilter(vpcId))
  });

  return {
    describe: describeSubnets
  };
}


module.exports = getSubnetManager;

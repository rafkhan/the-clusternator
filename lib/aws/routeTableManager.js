'use strict';

var Q = require('q'),
    constants = require('../constants'),
    util = require('../util');

function getRouteTableManager(ec2, vpcId) {
  var describeRouteTables = Q.nfbind(ec2.describeRouteTables.bind(ec2), {
    DryRun: false,
    Filters: constants.AWS_FILTER_CTAG.concat(util.makeAWSVPCFilter(vpcId))
  });

  return {
    describe: describeRouteTables
  };
}

module.exports = getRouteTableManager;
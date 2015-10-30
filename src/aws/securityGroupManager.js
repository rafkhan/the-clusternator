'use strict';

var Q = require('q'),
util = require('../util'),
constants = require('../constants');

function getSecurityGroupManager(ec2, vpcId) {
    var describeSecurityGroups = Q.nfbind(ec2.describeSecurityGroups.bind(ec2), {
    DryRun: false,
    Filters: constants.AWS_FILTER_CTAG.concat(util.makeAWSVPCFilter(vpcId))
  });

  return {
    describe: describeSecurityGroups
  };
}


module.exports = getSecurityGroupManager;

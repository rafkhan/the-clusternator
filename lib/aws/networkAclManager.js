'use strict';

var Q = require('q'),
    util = require('../util'),
    constants = require('../constants');

function getAclManager(ec2, vpcId) {
  var describeNetworkAcls = Q.nfbind(ec2.describeNetworkAcls.bind(ec2), {
    DryRun: false,
    Filters: constants.AWS_FILTER_CTAG.concat(util.makeAWSVPCFilter(vpcId))
  });

  return {
    describe: describeNetworkAcls
  };
}

module.exports = getAclManager;
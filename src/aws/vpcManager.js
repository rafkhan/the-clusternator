'use strict';

var Q = require('q'),
constants = require('../constants');

function getVpcManager(ec2) {
  var describeClusterVPCs = Q.nfbind(ec2.describeVpcs, {
      DryRun: false,
      Filters: constants.AWS_FILTER_CTAG
    });


  return {
    describe: describeClusterVPCs
  };
}


module.exports = getVpcManager;

'use strict';

var Q = require('q'),
constants = require('../constants'),
util = require('../util');

function getRouteTableManager (ec2, vpcId) {
  var describeRouteTables = Q.nfbind(ec2.describeRouteTables.bind(ec2), {
    DryRun: false,
    Filters: constants.AWS_FILTER_CTAG.concat(util.makeAWSVPCFilter(vpcId))
  });

  function findDefaultRoute() {
    return describeRouteTables().then(function (routes) {
      var theRouteDesc;
      routes.RouteTables.forEach(function (rDesc) {
        rDesc.Tags.forEach(function (tag) {
          if (tag.Key === constants.CLUSTERNATOR_TAG) {
            theRouteDesc = rDesc;
          }
        });
      });
      if (!theRouteDesc) {
        throw new Error('No Clusternator Route For VPC: ' + vpcId);
      }
      return theRouteDesc;
    });
  }

  return {
    describe: describeRouteTables,
    findDefault: findDefaultRoute
  };
}

module.exports = getRouteTableManager;

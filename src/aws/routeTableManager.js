'use strict';

const constants = require('../constants');
const util = require('../util');
const common = require('./common');

function getRouteTableManager(ec2, vpcId) {
  ec2 = util.makePromiseApi(ec2);

  var baseFilters =
    constants.AWS_FILTER_CTAG.concat(common.makeAWSVPCFilter(vpcId)),
    describe = common.makeEc2DescribeFn(ec2, 'describeRouteTables',
      'RouteTables', baseFilters);

  function findDefault() {
    return describe().then(function(routes) {
      var theRouteDesc;
      routes.forEach(function(rDesc) {
        rDesc.Tags.forEach(function(tag) {
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
    describe,
    findDefault
  };
}

module.exports = getRouteTableManager;

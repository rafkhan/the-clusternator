'use strict';
/**
 * Simplifies dealing with AWS VPC route tables
 *
 * @module aws/routeTableManager
 */

const constants = require('../constants');
const awsConstants = require('./aws-constants');
const util = require('../util');
var common = require('./common');

function getRouteTableManager(ec2, vpcId) {
  ec2 = util.makePromiseApi(ec2);

  var baseFilters =
    awsConstants.AWS_FILTER_CTAG.concat(common.makeAWSVPCFilter(vpcId)),
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

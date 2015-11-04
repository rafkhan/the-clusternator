'use strict';

var Q = require('q'),
R = require('ramda'),
common = require('./common'),
constants = require('../constants');

function getNicManager(ec2) {
  var baseFilters = constants.AWS_FILTER_CTAG,
    describe = common.makeEc2DescribeFn(
      ec2, 'describeNetworkInterfaces', 'NetworkInterfaces', baseFilters);

  function rejectIfExists(pid, pr) {
    return describe().then(function (list) {
      list.NetworkInterfaces.forEach(function (nicDesc) {
        var isProject = false, isPR = false;
        nicDesc.TagSet.forEach(function (tag) {
          if ((tag.Key === constants.PROJECT_TAG) && (tag.Value === pid)) {
            isProject = true;
          }
          if ((tag.Key === constants.PR_TAG) && (tag.Value === pr)) {
            isPR = true;
          }
        });
        if (isProject && isPR) {
          throw new Error('NetworkInterface Exists For Project: ' + pid +
          ' PR: ' + pr);
        }
      });
    });
  }

  function createNic(subnetId, sgIds, pid, pr) {
    var params = {
      SubnetId: subnetId,
      Groups: sgIds,
      Description: 'Created by clusternator for ' + pid + ', PR: ' + pr
    };

    return Q.nfbind(ec2.createNetworkInterface.bind(ec2), params)().
    then(function (result) {
      return common.awsTagEc2(ec2, result.NetworkInterface.NetworkInterfaceId, [
        {
          Key: constants.CLUSTERNATOR_TAG,
          Value: 'true'
        },
        {
          Key: constants.PROJECT_TAG,
          Value: pid
        },
        {
          Key: constants.PR_TAG,
          Value: pr
        }
      ]).then(function () {
        return result;
      });
    });
  }

  function create(subnetId, sgIds, pid, pr) {
    return rejectIfExists(pid, pr).then(function () {
      return createNic(subnetId, sgIds, pid, pr);
    });
  }

  function destroy(pid, pr) {
    if (!pid || !pr) {
      throw new Error('Destroy NIC Requires projectId, and Pull Request #');
    }
    return describe(pid, pr).then(function (list) {
      if (!list.length) {
        common.throwInvalidPidPrTag(pid, pr, 'looking', 'NetworkInterface');
      }

      return Q.nfbind(ec2.deleteNetworkInterface.bind(ec2), {
        NetworkInterfaceId: list[0].NetworkInterfaceId
      })();
    });
  }

  return {
    describe: describe,
    create: create,
    destroy: destroy
  };
}


module.exports = getNicManager;

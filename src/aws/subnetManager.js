'use strict';

var Q = require('q'),
util = require('../util'),
constants = require('../constants');

function getSubnetManager(ec2, vpcId) {
  var describe = Q.nfbind(ec2.describeSubnets.bind(ec2), {
    DryRun: false,
    Filters: constants.AWS_FILTER_CTAG.concat(util.makeAWSVPCFilter(vpcId))
  });

  function destroy(subnetId, pid) {
    return describe().then(function (list) {
      var subnet, isValid = false;
      list.Subnets.forEach(function (sn){
        if (sn.SubnetId === subnetId) {
          subnet = sn;
        }
      });

      subnet.Tags.forEach(function (tag) {
        if (tag.Key !== constants.PROJECT_TAG) {
          return;
        }
        if (tag.Value === pid) {
          isValid = true;
        }
      });

      if (!isValid) {
        throw new Error('No Clusternator Tagged Subnet Available For ' +
        'Destruction With SubnetId: ' + subnetId);
      }

      return Q.nfbind(ec2.deleteSubnet.bind(ec2), {
          SubnetId: subnetId
      })();
    });
  }

  function create(params) {
    if (!params || !params.pid) {
      throw new Error('subnetManager.create requires a params object with a ' +
      'pid value (project id)');
    }
    var awsParams = {
        VpcId: vpcId,
        CidrBlock: params.CidrBlock || constants.AWS_DEFAULT_CIDR,
        AvailabilityZone: params.AvailabilityZone ||
          constants.AWS_DEFAULT_AZ
    };
    return Q.nbind(ec2.createSubnet, ec2)(awsParams).then(function (results) {
          return util.awsTagEc2(ec2, results.Subnet.SubnetId, [
            {
                Key: constants.CLUSTERNATOR_TAG,
                Value: 'true'
            },
            {
              Key: constants.PROJECT_TAG,
              Value: params.pid
            }
          ]).then(function () {
            return results;
          });
    });
  }

  /**
    finds a subnet from a project
    @param {string} projectId
    @param {Object} list (see AWS docs)
    http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeVpcs-property
  */
  function findProjectTag(projectId, list) {
      var subnet = null;
      list.Subnets.forEach(function (sDesc) {
        sDesc.Tags.forEach(function (tag) {
          if (tag.Key !== constants.PROJECT_TAG) {
            return;
          }
          if (tag.Value === projectId) {
            subnet = sDesc;
          }
        });
      });
      return subnet;
  }

  function findProjectSubnet(projectId) {
    return describe().then(function (list) {
      var subnet = findProjectTag(projectId, list);
      if (subnet) {
          return subnet;
      }
      throw new Error('No Clusternator Subnet Found For Project: ' + projectId);
    });
  }

  return {
    describe: describe,
    create: create,
    destroy: destroy,
    findProject: findProjectSubnet
  };
}


module.exports = getSubnetManager;

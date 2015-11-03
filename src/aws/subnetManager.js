'use strict';

var Q = require('q'),
util = require('../util'),
Vpc = require('./vpcManager'),
constants = require('../constants');

function getSubnetManager(ec2, vpcId) {
  var vpc = Vpc(ec2),
  describe = Q.nfbind(ec2.describeSubnets.bind(ec2), {
    DryRun: false,
    Filters: constants.AWS_FILTER_CTAG.concat(util.makeAWSVPCFilter(vpcId))
  });

  function getCidrPrefix(pid) {
    return vpc.findProject(pid).then(function (v) {
      var classes = v.CidrBlock.split('.');
      return classes[0] + '.' + classes[1];
    });
  }

  function getCidrPostfix() {
    return describe().then(function (results) {
      var highest = -1;
      results.Subnets.forEach(function (r) {
        var cidr = r.CidrBlock,
        classes = cidr.split('.'),
        c;
        classes.pop();
        c = +classes.pop();
        if (c > highest) {
          highest = c;
        }
      });
      highest += 1;
      return highest + '.0/24';
    });
  }

  function getNextSubnet(pid) {
    return Q.all([
      getCidrPrefix(pid),
      getCidrPostfix()
    ]).then(function (results) {
      return results[0] + '.' + results[1];
    });
  }

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

  function createSubnet(params) {
    var pid = params.pid;
    delete params.pid; // aws doesn't like extra params :/
    return Q.nbind(ec2.createSubnet, ec2)(params).then(function (results) {
      return util.awsTagEc2(ec2, results.Subnet.SubnetId, [
        {
          Key: constants.CLUSTERNATOR_TAG,
          Value: 'true'
        },
        {
          Key: constants.PROJECT_TAG,
          Value: pid
        }
      ]).then(function () {
        return results;
      });
    });
  }

  function findExistingPid(pid) {
    return describe().then(function (result) {
        result.Subnets.forEach(function (sn) {
          sn.Tags.forEach(function (tag) {
              if (tag.Key === constants.PROJECT_TAG) {
                if (tag.Value === pid) {
                  throw new Error('Create Subnet Failed: Project: ' + pid +
                ' exists: ' + sn);
                }
              }
          });
        });
    });
  }

  function create(pid, az) {
    if (!pid) {
      throw new Error('subnetManager.create requires a params object with a ' +
      'pid value (project id)');
    }
    return findExistingPid(pid).then(function () {
      return getNextSubnet(pid).then(function (cidr) {
        return {
          VpcId: vpcId,
          CidrBlock: cidr,
          AvailabilityZone: az || constants.AWS_DEFAULT_AZ,
          pid: pid
        };
      });
    }).then(createSubnet);
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
    findProject: findProjectSubnet,
    next: getNextSubnet,
    cidrPrefix: getCidrPrefix
  };
}

module.exports = getSubnetManager;

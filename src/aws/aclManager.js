'use strict';

var Q = require('q'),
util = require('../util'),
constants = require('../constants');

function getAclManager(ec2, vpcId) {
  var describe = Q.nfbind(ec2.describeNetworkAcls.bind(ec2), {
    DryRun: false,
    Filters: constants.AWS_FILTER_CTAG.concat(util.makeAWSVPCFilter(vpcId))
  });

  function describeDefault() {
    // Trying to use a Filter on 'default', as per the docs didn't work
    // AWS wants a boolean, but their code wants a string, nothing comes back
    // filter default manually instead
    return Q.nfbind(ec2.describeNetworkAcls.bind(ec2), {
      DryRun: false,
      Filters: util.makeAWSVPCFilter(vpcId) })().
      then(function (results) {
        return results.NetworkAcls.filter(function (a) {
          return a.IsDefault;
        });
      });
    }

    function defaultAssoc(aclId) {
      return describeDefault().then(function (list) {
        if (!list.length) {
          throw new Error('AclManager: Error expecting a default ACL');
        }
        console.log('word', list[0].Associations);
        return list[0].Associations.filter(function (el) {
          console.log('compare', aclId, el.NetworkAclId);
          return el.NetworkAclId === aclId;
        });
      });
    }

    function defaultAssocId(aclId) {
      return defaultAssoc(aclId).then(function (list) {
        if (!list.length) {
          throw new Error('AclManager: Error expecting a default ACL ' +
          'Association');
        }
        return list[0].NetworkAclAssociationId;
      });
    }

    function defaultInOutRules(aclId) {
      var inbound = constants.AWS_DEFAULT_ACL_INGRESS,
      outbound = constants.AWS_DEFAULT_ACL_EGRESS;

      inbound.NetworkAclId = aclId;
      outbound.NetworkAclId = aclId;

      return Q.all([
        Q.nfbind(ec2.createNetworkAclEntry.bind(ec2), inbound)(),
        Q.nfbind(ec2.createNetworkAclEntry.bind(ec2), outbound)()
      ]);
    }

    function create(subnetId, pid) {
      var params = {
        VpcId: vpcId
      };

      return Q.nfbind(ec2.createNetworkAcl.bind(ec2), params)().
      then(function (result) {
        var aclId = result.NetworkAcl.NetworkAclId;
        return Q.all([
          util.awsTagEc2(ec2, aclId, [
            {
              Key: constants.CLUSTERNATOR_TAG,
              Value: 'true'
            },
            {
              Key: constants.PROJECT_TAG,
              Value: pid
            }
          ]),
          defaultInOutRules(aclId),
          defaultAssocId(aclId).then(function (assocId) {
            return Q.nfbind(ec2.replaceNetworkAclAssociation({
              AssociationId: assocId,
              NetworkAclId: result.NetworkAcl.NetworkAclId
            }));
          })
        ]).then(function () {
          return result;
        });
      });
    }

    function destroy(aclId, pid) {
      return describe().then(function (list) {
        var acl, isValidPid = false;
        list.NetworkAcls.forEach(function (g){
          if (g.NetworkAclId === aclId) {
            acl = g;
          }
        });

        acl.Tags.forEach(function (tag) {
          if (tag.Key === constants.PROJECT_TAG) {
            if (tag.Value === pid) {
              isValidPid = true;
            }
          }
        });

        if (!isValidPid) {
          throw new Error('No Clusternator Tagged NetworkAcl Available For ' +
          'Destruction With NetworkAclId: ' + aclId + ' ProjectId: ' + pid);
        }

        return Q.nfbind(ec2.deleteNetworkAcl.bind(ec2), {
          NetworkAclId: aclId
        })();
      });
    }

    return {
      describe: describe,
      describeDefault: describeDefault,
      defaultAssocId: defaultAssocId,
      create: create,
      destroy: destroy
    };
  }


  module.exports = getAclManager;

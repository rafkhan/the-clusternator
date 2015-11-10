'use strict';

var rewire = require('rewire'),
  constants = require('../../../src/constants'),
  VpcMock = require('./vpc-mock'),
  ec2Mock = require('./ec2-mock');

var Subnet = rewire('../../../src/aws/subnetManager');
require('../chai');


/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions: 0*/
describe('subnetManager', function() {
  var subnet,
    cidrList = [{
      CidrBlock: '1.2.3.4'
    }, {
      CidrBlock: '1.2.200.4'
    }, {
      CidrBlock: '1.2.0.4'
    }],
    origVPC;

  beforeEach(function() {
    origVPC = Subnet.__get__('Vpc');
    Subnet.__set__('Vpc', VpcMock);
    subnet = Subnet(ec2Mock, 'vpc-id');
  });

  afterEach(function() {
    Subnet.__set__('Vpc', origVPC);
  });

  it('should asynchronously list subnets', function(done) {
    ec2Mock.setDescribeSubnets([1, 2, 3]);
    subnet.describe().then(function(list) {
      expect(list).to.be.ok;
      done();
    }, function(err) {
      // not this case
      expect(err).equal(undefined);
      done();
    });
  });

  it('should reject its promise on fail', function(done) {
    ec2Mock.setDescribeSubnets(new Error('test'));
    subnet.describe().then(function(list) {
      // not this case
      expect(list).equal(undefined);
      done();
    }, function(err) {
      expect(err instanceof Error).to.be.true;
      done();
    });
  });

  it('findHighestCidr should return the "highest" subnet in a collection ' +
    'of CIDR Blocks',
    function() {
      expect(
        subnet.helpers.findHighestCidr(cidrList)
      ).to.equal(200);
    });

  it('incrementHighestCidr should return the C/D classes of the highest ' +
    ' /24 block + 1',
    function() {
      expect(
        subnet.helpers.incrementHighestCidr(cidrList)
      ).to.equal('201.0/24');
    });

  it('isPidInSubnetList should return true if a matching pid is found in ' +
    ' a list of subnets',
    function() {
      expect(subnet.helpers.isPidInSubnetList('test', [{
        Tags: [{
          Key: constants.PROJECT_TAG,
          Value: 'test'
        }]
      }])).to.be.true;
    });

  it('isPidInSubnetList should return false if no match is found in a list ' +
    ' of subnets',
    function() {
      expect(subnet.helpers.isPidInSubnetList('test', [{
        Tags: [{
          Key: constants.PROJECT_TAG,
          Value: 'test wrong'
        }]
      }])).to.be.false;
    });

  it('destroy should throw without a pid', function() {
    try {
      subnet.destroy();
      expect('this should not happen').to.be(undefined);
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  });

  it('create should throw without a pid', function() {
    try {
      subnet.create();
      expect('this should not happen').to.be(undefined);
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  });

  it('create should throw without a routeId', function() {
    try {
      subnet.create('test-proj');
      expect('this should not happen').to.be(undefined);
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  });

  it('create should throw without an aclId', function() {
    try {
      subnet.create('test-proj', 'some-route');
      expect('this should not happen').to.be(undefined);
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  });

  it('findProjectTag should return null if given a list without a ' +
    'clusternator project tag',
    function() {
      expect(subnet.helpers.findProjectTag('id', [{
        Tags: [{
          Key: 'hahah',
          Value: 'not found'
        }]
      }])).to.be.null;
    });

  it('findProjectTag should return truthy if given a list with a ' +
    'clusternator project tag',
    function() {
      expect(subnet.helpers.findProjectTag('id', [{
        Tags: [{
          Key: constants.PROJECT_TAG,
          Value: 'id'
        }]
      }])).to.be.ok;
    });

  it('getFilteredAssociations should throw if given an empty list',
    function() {
      try {
        subnet.helpers.getFilteredAssociations('blah', []);
        expect('this should not happen').to.equal(undefined);
      } catch (err) {
        expect(err instanceof Error).to.be.true;
      }
    });

  it('getFilteredAssociations should return a list of ACL associations ' +
    'matching the subnetId if the subnet is in the first list',
    function() {
      expect(subnet.helpers.getFilteredAssociations('test', [{
        Associations: [{
          SubnetId: '1'
        }, {
          SubnetId: '2'
        }, {
          SubnetId: 'test'
        }]
      }]).length).to.equal(1);
    });

  it('getCidrPrefix should return the A/B class of the mock ip data',
    function(done) {
      subnet.helpers.getCidrPrefix().then(function(result) {
        expect(result).to.equal('192.168');
        done();
      }, function(err) {
        expect(err instanceof Error).to.not.be;
        done();
      });
    })

  it('getCidrPostfix should return the *incremented* C/D class, *and* the ' +
    '/N netmask of the mock IP data',
    function(done) {
      subnet.helpers.getCidrPostfix().then(function(result) {
        expect(result).to.equal('1.0/24');
        done();
      }, function(err) {
        expect(err instanceof Error).to.not.be;
        done();
      })
    });

  it('concatSubnetComponents should join an string array with a "."',
    function() {
      expect(subnet.helpers.concatSubnetComponents(['a', 'b'])).to.equal('a.b');
    });

  it('getNextSubnet should return a complete subnet string for the next ' +
    'highest subnet',
    function(done) {
      subnet.helpers.getNextSubnet().then(function(result) {
        expect(result).to.equal('192.168.1.0/24');
        done();
      }, function(err) {
        expect(err instanceof Error).to.not.be;
        done();
      })
    });

  it('associateRoute should return a promise', function(done) {
    subnet.helpers.associateRoute({
      Subnet: {}
    }).then(function() {
      expect(true).to.be;
      done();
    }, function(err) {
      expect(err instanceof Error).to.not.be;
      done();
    })
  });

  it('throwIfPidNotFound should throw if project id not found in given list',
    function() {
      try {
        subnet.helpers.throwIfPidNotFound('test', []);
        expect('this case should not run').to.not.be;
      } catch (err) {
        expect(err instanceof Error).to.be;
      }
    });

  it('throwIfSubnetNotFound should throw if project id not found in given list',
    function() {
      try {
        subnet.helpers.throwIfSubnetNotFound('test', []);
        expect('this case should not run').to.not.be;
      } catch (err) {
        expect(err instanceof Error).to.be;
      }
    });

  it('throwIfSubnetNotFound should return the SubnetDescription if it exists',
    function() {
      var result = subnet.helpers.throwIfSubnetNotFound('test', [{
        Tags: [{
          Key: constants.PROJECT_TAG,
          Value: 'test'
        }]
      }]);
      expect(result).to.be;
    });

  it('findExistingPid, should reject if project id not found', function(done) {
    subnet.helpers.findExistingPid().then(function(done) {
      expect('this case not to happen').to.not.be;
      done();
    }, function(err) {
      expect(err instanceof Error).to.be;
      done();
    })
  });

  it('findProjectSubnet should reject if no subnet found', function(done) {
    subnet.findProject().then(function(done) {
      expect('this case not to happen').to.not.be;
      done();
    }, function(err) {
      expect(err instanceof Error).to.be;
      done();
    })
  });

  it('filterIsDefault should return a list of NetworkAcl\'s tagged with ' +
    'IsDefault',
    function() {
      expect(subnet.helpers.filterIsDefault({
        NetworkAcls: [{
          IsDefault: false
        }, {
          IsDefault: true
        }]
      })[0].IsDefault).to.be
    });

  it('defaultAssoc should return a promise', function(done) {
    subnet.helpers.defaultAssoc().then(function() {
      expect('this case not to happen').to.not.be;
      done();
    }, function(err) {
      expect(err instanceof Error).to.be;
      done();
    });
  });

  it('defaultAssocId should reject if subnet is not found', function(done) {
    subnet.helpers.defaultAssocId().then(function() {
      expect('this case not to happen').to.not.be;
      done();
    }, function(err) {
      expect(err instanceof Error).to.be;
      done();
    });
  });

  it('throwIfNetworkAclAssocListEmpty should throw if list is empty',
    function() {
      try {
        subnet.helpers.throwIfNetworkAclAssocListEmpty([]);
        expect('this case not to happen').to.not.be;
      } catch (err) {
        expect(err instanceof Error).to.be;
      }
    });

  it('throwIfNetworkAclAssocListEmpty should return the ' +
    'NetworkAclAssociation if the list is valid',
    function() {
      expect(
        subnet.helpers.throwIfNetworkAclAssocListEmpty([{
          NetworkAclAssociationId: 'test!'
        }])
      ).to.equal('test!');
    });

});

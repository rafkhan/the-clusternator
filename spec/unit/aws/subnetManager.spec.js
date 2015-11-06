'use strict';

var rewire = require('rewire'),
  constants = require('../../../src/constants'),
  ec2Mock = require('./ec2-mock');

var Subnet = rewire('../../../src/aws/subnetManager');
require('../chai');


/*global describe, it, expect, beforeEach */
/*eslint no-unused-expressions: 0*/
describe('subnetManager', function() {
  var subnet,
    cidrList = [{
      CidrBlock: '1.2.3.4'
    }, {
      CidrBlock: '1.2.200.4'
    }, {
      CidrBlock: '1.2.0.4'
    }];

  beforeEach(function() {
    subnet = Subnet(ec2Mock, 'vpc-id');
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
        subnet.findHighestCidr(cidrList)
      ).to.equal(200);
    });

  it('incrementHighestCidr should return the C/D classes of the highest ' +
    ' /24 block + 1',
    function() {
      expect(
        subnet.incrementHighestCidr(cidrList)
      ).to.equal('201.0/24');
    });

  it('isPidInSubnetList should return true if a matching pid is found in ' +
    ' a list of subnets',
    function() {
      expect(subnet.isPidInSubnetList('test', [{
        Tags: [{
          Key: constants.PROJECT_TAG,
          Value: 'test'
        }]
      }])).to.be.true;
    });

  it('isPidInSubnetList should return false if no match is found in a list ' +
    ' of subnets',
    function() {
      expect(subnet.isPidInSubnetList('test', [{
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
      expect(subnet.findProjectTag('id', [{
        Tags: [{
          Key: 'hahah',
          Value: 'not found'
        }]
      }])).to.be.null;
    });

  it('findProjectTag should return truthy if given a list with a ' +
    'clusternator project tag',
    function() {
      expect(subnet.findProjectTag('id', [{
        Tags: [{
          Key: constants.PROJECT_TAG,
          Value: 'id'
        }]
      }])).to.be.ok;
    });

  it('getFilteredAssociations should throw if given an empty list',
    function() {
      try {
        subnet.getFilteredAssociations('blah', []);
        expect('this should not happen').to.equal(undefined);
      } catch (err) {
        expect(err instanceof Error).to.be.true;
      }
    });

  it('getFilteredAssociations should return a list of ACL associations ' +
    'matching the subnetId if the subnet is in the first list',
    function() {
      expect(subnet.getFilteredAssociations('test', [{
        Associations: [{
          SubnetId: '1'
        }, {
          SubnetId: '2'
        }, {
          SubnetId: 'test'
        }]
      }]).length).to.equal(1);
    });
});

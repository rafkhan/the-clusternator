'use strict';

var rewire = require('rewire'),
ec2Mock = require('./ec2-mock');

var Subnet = rewire('../../../src/aws/subnetManager');
require('../chai');


/*global describe, it, expect, beforeEach */
/*eslint no-unused-expressions: 0*/
describe('subnetManager', function () {
  var subnet;

  beforeEach(function () {
      subnet = Subnet(ec2Mock, 'vpc-id');
  });

  it('should asynchronously list subnets', function (done) {
    ec2Mock.setDescribeSubnets([1, 2, 3]);
    subnet.describe().then(function (list) {
      expect(list).to.be.ok;
      done();
    }, function (err) {
      // not this case
      expect(err).equal(undefined);
      done();
    });
  });

  it('should reject its promise on fail', function (done) {
    ec2Mock.setDescribeSubnets(new Error('test'));
    subnet.describe().then(function (list) {
      // not this case
      expect(list).equal(undefined);
      done();
    }, function (err) {
      expect(err instanceof Error).to.be.true;
      done();
    });
  });
});

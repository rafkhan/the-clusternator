'use strict';

var rewire = require('rewire'),
ec2Mock = require('./ec2-mock');

var subnet = rewire('../src/subnetManager');
require('./chai');


/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions: 0*/
describe('subnetManager', function () {
  var oldEc2;
  beforeEach(function () {
    oldEc2 = subnet.__get__('ec2');
    subnet.__set__('ec2', ec2Mock);
  });

  afterEach(function () {
    subnet.__set__('ec2', oldEc2);
  });

  it('should asynchronously list subnets', function (done) {
    ec2Mock.setDescribeSubnets([1, 2, 3]);
    subnet.list().then(function (list) {
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
    subnet.list().then(function (list) {
      // not this case
      expect(list).equal(undefined);
      done();
    }, function (err) {
      expect(err instanceof Error).to.be.true;
      done();
    });
  });
});

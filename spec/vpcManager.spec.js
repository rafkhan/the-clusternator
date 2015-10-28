'use strict';

var rewire = require('rewire'),
ec2Mock = require('./ec2-mock');

var vpc = rewire('../src/vpcManager');
require('./chai');


/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions: 0*/
describe('vpcManager', function () {
  var oldEc2;
  beforeEach(function () {
    oldEc2 = vpc.__get__('ec2');
    vpc.__set__('ec2', ec2Mock);
  });

  afterEach(function () {
    vpc.__set__('ec2', oldEc2);
  });

  it('should asynchronously list vpcs', function (done) {
    ec2Mock.setDescribeVPCs([1, 2, 3]);
    vpc.list().then(function (list) {
      expect(list).to.be.ok;
      done();
    }, function (err) {
      // not this case
      expect(err).equal(undefined);
      done();
    });
  });

  it('should reject its promise on fail', function (done) {
    ec2Mock.setDescribeVPCs(new Error('test'));
    vpc.list().then(function (list) {
      // not this case
      expect(list).equal(undefined);
      done();
    }, function (err) {
      expect(err instanceof Error).to.be.true;
      done();
    });
  });
});

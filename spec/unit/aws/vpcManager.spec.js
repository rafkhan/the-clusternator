'use strict';

var rewire = require('rewire'),
ec2Mock = require('./ec2-mock');

var Vpc = rewire('../../../src/aws/vpcManager');
require('../chai');


/*global describe, it, expect, beforeEach */
/*eslint no-unused-expressions: 0*/
describe('vpcManager', function () {
  var vpc;

  beforeEach(function () {
      vpc = Vpc(ec2Mock);
  });

  it('should asynchronously list vpcs', function (done) {
    ec2Mock.setDescribeVPCs([1, 2, 3]);
    vpc.describe().then(function (list) {
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
    vpc.describe().then(function (list) {
      // not this case
      expect(list).equal(undefined);
      done();
    }, function (err) {
      expect(err instanceof Error).to.be.true;
      done();
    });
  });
});

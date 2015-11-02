'use strict';

var rewire = require('rewire'),
ec2Mock = require('./ec2-mock');

var SecurityGroup = rewire('../../src/aws/securityGroupManager');
require('./chai');


/*global describe, it, expect, beforeEach */
/*eslint no-unused-expressions: 0*/
describe('securityGroupManager', function () {
  var securityGroup;

  beforeEach(function () {
      securityGroup = SecurityGroup(ec2Mock, 'vpc-id');
  });

  it('should asynchronously list securityGroups', function (done) {
    ec2Mock.setDescribeSecurityGroups([1, 2, 3]);
    securityGroup.describe().then(function (list) {
      expect(list).to.be.ok;
      done();
    }, function (err) {
      // not this case
      expect(err).equal(undefined);
      done();
    });
  });

  it('should reject its promise on fail', function (done) {
    ec2Mock.setDescribeSecurityGroups(new Error('test'));
    securityGroup.describe().then(function (list) {
      // not this case
      expect(list).equal(undefined);
      done();
    }, function (err) {
      expect(err instanceof Error).to.be.true;
      done();
    });
  });
});

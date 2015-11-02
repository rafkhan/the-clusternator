'use strict';

var rewire = require('rewire'),
ec2Mock = require('./ec2-mock');

var NetworkAcl = rewire('../../src/aws/networkAclManager');
require('./chai');


/*global describe, it, expect, beforeEach */
/*eslint no-unused-expressions: 0*/
describe('networkAclManager', function () {
  var networkAcl;

  beforeEach(function () {
      networkAcl = NetworkAcl(ec2Mock, 'vpc-id');
  });

  it('should asynchronously list networkAcls', function (done) {
    ec2Mock.setDescribeNetworkAcls([1, 2, 3]);
    networkAcl.describe().then(function (list) {
      expect(list).to.be.ok;
      done();
    }, function (err) {
      // not this case
      expect(err).equal(undefined);
      done();
    });
  });

  it('should reject its promise on fail', function (done) {
    ec2Mock.setDescribeNetworkAcls(new Error('test'));
    networkAcl.describe().then(function (list) {
      // not this case
      expect(list).equal(undefined);
      done();
    }, function (err) {
      expect(err instanceof Error).to.be.true;
      done();
    });
  });
});

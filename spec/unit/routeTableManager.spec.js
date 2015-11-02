'use strict';

var rewire = require('rewire'),
ec2Mock = require('./ec2-mock');

var RouteTable = rewire('../../src/aws/routeTableManager');
require('./chai');


/*global describe, it, expect, beforeEach */
/*eslint no-unused-expressions: 0*/
describe('routeTableManager', function () {
  var routeTable;
  beforeEach(function () {
      routeTable = RouteTable(ec2Mock, 'vpc-id');
  });

  it('should asynchronously list routeTables', function (done) {
    ec2Mock.setDescribeRouteTables([1, 2, 3]);
    routeTable.describe().then(function (list) {
      expect(list).to.be.ok;
      done();
    }, function (err) {
      // not this case
      expect(err).equal(undefined);
      done();
    });
  });

  it('should reject its promise on fail', function (done) {
    ec2Mock.setDescribeRouteTables(new Error('test'));
    routeTable.describe().then(function (list) {
      // not this case
      expect(list).equal(undefined);
      done();
    }, function (err) {
      expect(err instanceof Error).to.be.true;
      done();
    });
  });
});

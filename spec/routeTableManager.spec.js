'use strict';

var rewire = require('rewire'),
ec2Mock = require('./ec2-mock');

var routeTable = rewire('../src/routeTableManager');
require('./chai');


/*global describe, it, expect */
/*eslint no-unused-expressions: 0*/
describe('routeTableManager', function () {

  it('should asynchronously list routeTables', function (done) {
    ec2Mock.setDescribeRouteTables([1, 2, 3]);
    routeTable.list(ec2Mock, 'vpc-id').then(function (list) {
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
    routeTable.list(ec2Mock, 'vpc-id').then(function (list) {
      // not this case
      expect(list).equal(undefined);
      done();
    }, function (err) {
      expect(err instanceof Error).to.be.true;
      done();
    });
  });
});

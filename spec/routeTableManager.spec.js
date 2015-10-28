'use strict';

var rewire = require('rewire'),
ec2Mock = require('./ec2-mock');

var routeTable = rewire('../src/routeTableManager');
require('./chai');


/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions: 0*/
describe('routeTableManager', function () {
  var oldEc2;
  beforeEach(function () {
    oldEc2 = routeTable.__get__('ec2');
    routeTable.__set__('ec2', ec2Mock);
  });

  afterEach(function () {
    routeTable.__set__('ec2', oldEc2);
  });

  it('should asynchronously list routeTables', function (done) {
    ec2Mock.setDescribeRouteTables([1, 2, 3]);
    routeTable.list().then(function (list) {
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
    routeTable.list().then(function (list) {
      // not this case
      expect(list).equal(undefined);
      done();
    }, function (err) {
      expect(err instanceof Error).to.be.true;
      done();
    });
  });
});

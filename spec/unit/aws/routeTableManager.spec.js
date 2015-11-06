'use strict';

var rewire = require('rewire'),
  constants = require('../../../src/constants'),
  ec2Mock = require('./ec2-mock');

var RouteTable = rewire('../../../src/aws/routeTableManager');
require('../chai');


/*global describe, it, expect, beforeEach */
/*eslint no-unused-expressions: 0*/
describe('routeTableManager', function() {
  var routeTable;
  beforeEach(function() {
    routeTable = RouteTable(ec2Mock, 'vpc-id');
  });

  it('should asynchronously list routeTables', function(done) {
    ec2Mock.setDescribeRouteTables([1, 2, 3]);
    routeTable.describe().then(function(list) {
      expect(list).to.be.ok;
      done();
    }, function(err) {
      // not this case
      expect(err).equal(undefined);
      done();
    });
  });

  it('should reject its promise on fail', function(done) {
    ec2Mock.setDescribeRouteTables(new Error('test'));
    routeTable.describe().then(function(list) {
      // not this case
      expect(list).equal(undefined);
      done();
    }, function(err) {
      expect(err instanceof Error).to.be.true;
      done();
    });
  });

  it('findDefault should reject if a clusternator tag is not found',
    function(done) {
      ec2Mock.setDescribeRouteTables({
        RouteTables: [{
          Tags: []
        }]
      });

      routeTable.findDefault().then(function() {
        expect('this should not happen').to.not.be;
        done();
      }, function(err) {
        expect(err instanceof Error).to.be.true;
        done();
      })
    });

  it('findDefault should resolve if a clusternator tag is not found',
    function(done) {
      ec2Mock.setDescribeRouteTables({
        RouteTables: [{
          Tags: [{
            Key: constants.CLUSTERNATOR_TAG,
            Value: 'true'
          }]
        }]
      });

      routeTable.findDefault().then(function() {
        expect(true).to.be;
        done();
      }, function(err) {
        expect('this should not happen').to.not.be;
        done();
      })
    });
});

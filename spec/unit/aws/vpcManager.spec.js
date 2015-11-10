'use strict';

var rewire = require('rewire'),
  constants = require('../../../src/constants'),
  ec2Mock = require('./ec2-mock');

var Vpc = rewire('../../../src/aws/vpcManager');
require('../chai');


/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions: 0*/
describe('vpcManager', function() {
  var vpc;

  beforeEach(function() {
    vpc = Vpc(ec2Mock);
  });

  it('should asynchronously list vpcs', function(done) {
    ec2Mock.setDescribeVPCs([1, 2, 3]);
    vpc.describe().then(function(list) {
      expect(list).to.be.ok;
      done();
    }, function(err) {
      // not this case
      expect(err).equal(undefined);
      done();
    });
  });

  it('should reject its promise on fail', function(done) {
    ec2Mock.setDescribeVPCs(new Error('test'));
    vpc.describe().then(function(list) {
      // not this case
      expect(list).equal(undefined);
      done();
    }, function(err) {
      expect(err instanceof Error).to.be.true;
      done();
    });
  });

  it('findProjectTag should return null if given a list without a ' +
    'clusternator project tag',
    function() {
      expect(vpc.findProjectTag('id', {
        Vpcs: [{
          Tags: [{
            Key: 'hahah',
            Value: 'not found'
          }]
        }]
      })).to.be.null;
    });

  it('findProjectTag should return truthy if given a list with a ' +
    'clusternator project tag',
    function() {
      expect(vpc.findProjectTag('id', {
        Vpcs: [{
          Tags: [{
            Key: constants.PROJECT_TAG,
            Value: 'id'
          }]
        }]
      })).to.be.ok;
    });

  it('findMasterVPC should return truthy if given a list without a ' +
    'clusternator project tag',
    function() {
      expect(vpc.findMasterVPC({
        Vpcs: [{
          Tags: [{
            Key: 'I have no tags',
            Value: 'id'
          }]
        }]
      })).to.be.ok;
    });

  it('findMasterVPC should return null if given a list with a ' +
    'clusternator project tag',
    function() {
      expect(vpc.findMasterVPC({
        Vpcs: [{
          Tags: [{
            Key: constants.PROJECT_TAG,
            Value: 'id'
          }]
        }]
      })).to.be.null;
    });

  describe('test findProjectVPC', function() {
    var oldDescVpcs, list;

    beforeEach(function() {
      oldDescVpcs = ec2Mock.describeVpcs;
      ec2Mock.describeVpcs = function(params, cb) {
        cb(null, list);
      };
      // remake the vpc object so it uses the new function
      vpc = Vpc(ec2Mock);
    });

    afterEach(function() {
      ec2Mock.describeVpcs = oldDescVpcs;
    });

    it('findProjectVPC should return a VPC with a project tag *first* ' +
      ' if such a project exists',
      function(done) {
        list = {
          Vpcs: [{
            Tags: [{
              Key: constants.PROJECT_TAG,
              Value: 'id'
            }]
          }]
        };
        vpc.findProjectVPC('id').then(function(r) {
          expect(r.Tags[0].Value).to.equal('id');
          done();
        }, function(err) {
          expect(err).to.not.be;
          done();
        });
      });

    it('findProjectVPC should return a VPC without a project tag if the ' +
      ' matching VPC cannot be found, and there is a clusternator tagged VPC',
      function(done) {
        list = {
          Vpcs: [{
            Tags: [{
              Key: 'lol',
              Value: 'other'
            }]
          }]
        };
        vpc.findProjectVPC('id').then(function(r) {
          expect(r.Tags[0].Value).to.equal('other');
          done();
        }, function(err) {
          expect(err).to.not.be;
          done();
        });
      });

    it('findProjectVPC should reject if no VPC is found',
      function(done) {
        list = {
          Vpcs: []
        };
        vpc.findProjectVPC('id').then(function(r) {
          expect('this case should not happen').to.not.be;
          done();
        }, function(err) {
          expect(err instanceof Error).to.be.true;
          done();
        });
      });
  });
});

'use strict';

var rewire = require('rewire'),
  constants = require('../constants'),
  ec2Mock = require('./ec2-mock');

var Vpc = rewire('./vpcManager'),
  C = require('../chai');


/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions: 0*/
describe('vpcManager', () => {
  var vpc;

  beforeEach(() => {
    vpc = Vpc(ec2Mock);
  });

  it('should asynchronously list vpcs', (done) => {
    ec2Mock.setDescribeVPCs([1, 2, 3]);
    vpc.describe().then((list) => {
      C.check(done, () => {
        expect(list).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('should reject its promise on fail', (done) => {
    ec2Mock.setDescribeVPCs(new Error('test'));
    vpc.describe().then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.true;
      });
    });
  });

  it('findProjectTag should return null if given a list without a ' +
    'clusternator project tag', () => {
      expect(vpc.helpers.findProjectTag('id', {
        Vpcs: [{
          Tags: [{
            Key: 'hahah',
            Value: 'not found'
          }]
        }]
      })).to.be.null;
    });

  it('findProjectTag should return truthy if given a list with a ' +
    'clusternator project tag', () => {
      expect(vpc.helpers.findProjectTag('id', {
        Vpcs: [{
          Tags: [{
            Key: constants.PROJECT_TAG,
            Value: 'id'
          }]
        }]
      })).to.be.ok;
    });

  it('findMasterVPC should return truthy if given a list without a ' +
    'clusternator project tag', () => {
      expect(vpc.helpers.findMasterVPC({
        Vpcs: [{
          Tags: [{
            Key: 'I have no tags',
            Value: 'id'
          }]
        }]
      })).to.be.ok;
    });

  it('findMasterVPC should return null if given a list with a ' +
    'clusternator project tag', () => {
      expect(vpc.helpers.findMasterVPC({
        Vpcs: [{
          Tags: [{
            Key: constants.PROJECT_TAG,
            Value: 'id'
          }]
        }]
      })).to.be.null;
    });

  describe('test findProjectVPC', () => {
    var oldDescVpcs, list;

    beforeEach(() => {
      oldDescVpcs = ec2Mock.describeVpcs;
      ec2Mock.describeVpcs = (params, cb) => {
        cb(null, list);
      };
      // remake the vpc object so it uses the new function
      vpc = Vpc(ec2Mock);
    });

    afterEach(() => {
      ec2Mock.describeVpcs = oldDescVpcs;
    });

    it('findProjectVPC should return a VPC with a project tag *first* ' +
      ' if such a project exists', (done) => {
        list = {
          Vpcs: [{
            Tags: [{
              Key: constants.PROJECT_TAG,
              Value: 'id'
            }]
          }]
        };
        vpc.helpers.findProjectVPC('id').then((r) => {
          C.check(done, () => {
            expect(r.Tags[0].Value).to.equal('id');
          });
        }, C.getFail(done));
      });

    it('findProjectVPC should return a VPC without a project tag if the ' +
      ' matching VPC cannot be found, and there is a clusternator tagged VPC', (done) => {
        list = {
          Vpcs: [{
            Tags: [{
              Key: 'lol',
              Value: 'other'
            }]
          }]
        };
        vpc.helpers.findProjectVPC('id').then((r) => {
          C.check(done, () => {
            expect(r.Tags[0].Value).to.equal('other');
          });
        }, C.getFail(done));
      });

    it('findProjectVPC should reject if no VPC is found', (done) => {
      list = {
        Vpcs: []
      };
      vpc.helpers.findProjectVPC('id').then(C.getFail(done), (err) => {
        C.check(done, () => {
          expect(err instanceof Error).to.be.true;
        });
      });
    });
  });
});

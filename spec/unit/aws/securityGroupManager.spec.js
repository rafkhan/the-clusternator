'use strict';

var rewire = require('rewire'),
  constants = require('../../../src/constants'),
  ec2Mock = require('./ec2-mock');

var SecurityGroup = rewire('../../../src/aws/securityGroupManager'),
  C = require('../chai');


/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions: 0*/
describe('securityGroupManager', () => {
  var securityGroup;

  beforeEach(() => {
    securityGroup = SecurityGroup(ec2Mock, 'vpc-id');
  });

  it('should asynchronously list securityGroups', (done) => {
    ec2Mock.setDescribeSecurityGroups([1, 2, 3]);
    securityGroup.describe().then((list) => {
      C.check(done, () => {
        expect(list).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('should reject its promise on fail', (done) => {
    ec2Mock.setDescribeSecurityGroups(new Error('test'));
    securityGroup.describe().then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });
  });

  it('create should throw without a pid', () => {
    expect(() => {
      securityGroup.create();
    }).to.throw(Error);
  });

  it('create should throw without a pr', () => {
    expect(() => {
      securityGroup.create('test-project');
    }).to.throw(Error);
  });

  it('create should return a promise', () => {
    var p = securityGroup.create('test-project', '1');
    expect(typeof p.then).to.equal('function');
  });

  it('destroy should throw without a pid', () => {
    expect(() => {
      securityGroup.destroy();
    }).to.throw(Error);
  });

  it('destroy should throw without a pr', () => {
    expect(() => {
      securityGroup.destroy('test-project');
    }).to.throw(Error);
  });

  it('destroy should return a promise', () => {
    var p = securityGroup.destroy('test-project', '1');
    expect(typeof p.then).to.equal('function');
  });

  describe('tests that spy on ec2 api functions', () => {
    var inCalls = 0,
      outCalls = 0,
      oldInFn, oldOutFn;
    beforeEach(() => {
      oldInFn = ec2Mock.authorizeSecurityGroupIngress;
      oldOutFn = ec2Mock.authorizeSecurityGroupEgress;
      ec2Mock.authorizeSecurityGroupIngress = () => {
        inCalls += 1;
        oldInFn.apply(null, arguments);
      };
      ec2Mock.authorizeSecurityGroupEgress = () => {
        outCalls += 1;
        oldOutFn.apply(null, arguments);
      };
      securityGroup = SecurityGroup(ec2Mock, 'vpc-id');
    });

    afterEach(() => {
      ec2Mock.authorizeSecurityGroupIngress = oldInFn;
      ec2Mock.authorizeSecurityGroupEgress = oldOutFn;
    });

    it('defaultInOutRules should add ingress, and egress ec2 functions', (done) => {
      securityGroup.helpers.defaultInOutRules().then(() => {
        C.check(done, () => {
          expect(inCalls).to.equal(1);
          expect(outCalls).to.equal(1);
        });
      }, C.getFail(done));
    });
  });
});

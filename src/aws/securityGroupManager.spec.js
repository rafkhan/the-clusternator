'use strict';

const rewire = require('rewire');
const constants = require('../constants');
const ec2Mock = require('./ec2-mock');

const SecurityGroup = rewire('./securityGroupManager');
const C = require('../chai');


/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions: 0*/
describe('securityGroupManager', () => {
  let securityGroup;

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

  it('createPr should throw without a pid', () => {
    expect(() => {
      securityGroup.createPr();
    }).to.throw(Error);
  });

  it('createPr should throw without a pr', () => {
    expect(() => {
      securityGroup.createPr('test-project');
    }).to.throw(Error);
  });

  it('createPr should return a promise', () => {
    const p = securityGroup.createPr('test-project', '1');
    expect(typeof p.then).to.equal('function');
  });

  it('destroyPr should throw without a pid', () => {
    expect(() => {
      securityGroup.destroyPr();
    }).to.throw(Error);
  });

  it('destroyPr should throw without a pr', () => {
    expect(() => {
      securityGroup.destroyPr('test-project');
    }).to.throw(Error);
  });

  it('destroyPr should return a promise', () => {
    const p = securityGroup.destroyPr('test-project', '1');
    expect(typeof p.then).to.equal('function');
  });

  describe('tests that spy on ec2 api functions', () => {
    let inCalls = 0;
    let outCalls = 0;
    let oldInFn;
    let oldOutFn;
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

    it('defaultInOutRules should add ingress, and egress ec2 functions',
      (done) => {
        securityGroup.helpers.defaultInOutRules().then(() => {
          C.check(done, () => {
            expect(inCalls).to.equal(1);
            expect(outCalls).to.equal(1);
          });
        }, C.getFail(done));
      });
  });
});

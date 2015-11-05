'use strict';

var rewire = require('rewire'),
constants = require('../../../src/constants'),
ec2Mock = require('./ec2-mock');

var SecurityGroup = rewire('../../../src/aws/securityGroupManager');
require('../chai');


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

  it('create should throw without a pid', function () {
    try {
      securityGroups.create();
      expect('this case should not happen').to.not.be;
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  });

  it('create should throw without a pr', function () {
    try {
      securityGroups.create('test-project');
      expect('this case should not happen').to.not.be;
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  });

  it('create should return a promise', function () {
    var p = securityGroup.create('test-project', '1');
    expect(typeof p.then).to.equal('function');
  });

  it('destroy should throw without a pid', function () {
    try {
      securityGroups.destroy();
      expect('this case should not happen').to.not.be;
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  });

  it('destroy should throw without a pr', function () {
    try {
      securityGroups.destroy('test-project');
      expect('this case should not happen').to.not.be;
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  });

  it('destroy should return a promise', function () {
    var p = securityGroup.destroy('test-project', '1');
    expect(typeof p.then).to.equal('function');
  });

  it('hasPidPr should return true if matching pid/pr tags are found',
  function (){
    expect(
        securityGroup.hasPidPr('test', '1', [
          {
            Tags: [
              {
                Key: constants.PROJECT_TAG,
                Value: 'test'
              },
              {
                Key: constants.PR_TAG,
                Value: '1'
              }
            ]
          }
        ])
    ).to.be.true;
  });

  it('hasPidPr should return false if matching pr tags are not found',
  function (){
    expect(
        securityGroup.hasPidPr('test', '1', [
          {
            Tags: [
              {
                Key: constants.PROJECT_TAG,
                Value: 'test'
              }
            ]
          }
        ])
    ).to.be.false;
  });

  it('hasPidPr should return false if matching pid/pr tags are not found',
  function (){
    expect(
        securityGroup.hasPidPr('test', '1', [
          {
            Tags: [
              {
                Key: 'other',
                Value: 'test'
              }
            ]
          }
        ])
    ).to.be.false;
  });
});

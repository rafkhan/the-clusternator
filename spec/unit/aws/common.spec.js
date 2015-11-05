'use strict';

var common = require('../../../src/aws/common'),
  ec2 = require('./ec2-mock'),
  constants = require('../../../src/constants');
require('../chai');



/*global describe, it, expect */
/*eslint no-unused-expressions:0*/
describe('common AWS functions', function() {
  it('should have a function that makes an AWS key/value filter',
    function() {
      expect(common.makeAWSFilter('t', 1)).to.be;
    });

  it('should have a function that makes an AWS VPC filter',
    function() {
      expect(common.makeAWSFilter(1)).to.be;
    });

  it('throwInvalidPidTag should throw', function() {
    try {
      common.throwInvalidPidTag();
      expect('this should not happen').to.be(undefined);
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  });

  it('throwInvalidPidPrTag should throw', function() {
    try {
      common.throwInvalidPidPrTag();
      expect('this should not happen').to.be(undefined);
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  });

  it('areTagsPidValid should return true if pid tags match given pid',
    function() {
      expect(common.areTagsPidValid('test', [{
        Key: 'red herring',
        Value: 'not useful'
      }, {
        Key: constants.PROJECT_TAG,
        Value: 'test'
      }])).to.be.true;
    });

  it('areTagsPidValid should return false if pid tags do not match given pid',
    function() {
      expect(common.areTagsPidValid('test', [{
        Key: 'red herring',
        Value: 'not useful'
      }])).to.be.false;
    });

  it('areTagsPidPrValid should return true if pid/pr tags match given pid/pr',
    function() {
      expect(common.areTagsPidPrValid('test', 'pr', [{
        Key: 'red herring',
        Value: 'not useful'
      }, {
        Key: constants.PROJECT_TAG,
        Value: 'test'
      }, {
        Key: constants.PR_TAG,
        Value: 'pr'
      }])).to.be.true;
    });

  it('areTagsPidPrValid should return false if pid/pr tags do not match ' +
    'given pid',
    function() {
      expect(common.areTagsPidPrValid('test', 'pr', [{
        Key: 'red herring',
        Value: 'not useful'
      }, {
        Key: constants.PR_TAG,
        Value: 'pr'
      }])).to.be.false;
    });

  it('areTagsPidPrValid should return false if pid/pr tags do not match ' +
    'given pr',
    function() {
      expect(common.areTagsPidPrValid('test', 'pr', [{
        Key: 'red herring',
        Value: 'not useful'
      }, {
        Key: constants.PROJECT_TAG,
        Value: 'test'
      }])).to.be.false;
    });

  it('awsTagEc2 should return a promise if given a resource string, and ' +
    'a tags array',
    function() {
      expect(typeof common.awsTagEc2(ec2, 'test', []).then === 'function').
      to.be.true
    });

  it('awsTagEc2 should return a promise if given a resource array, and ' +
    'a tags array',
    function() {
      expect(typeof common.awsTagEc2(ec2, ['test'], []).then === 'function').
      to.be.true
    });
});

'use strict';

const common = require('./common');
const Q = require('q');
const util = require('../util');
const constants = require('../constants');
const C = require('../chai');

let ec2 = require('./ec2-mock');



/*global describe, it, expect, beforeEach */
/*eslint no-unused-expressions:0*/
describe('common AWS functions', () => {
  // all AWS wrappers use a promise wrapped ec2 object
  ec2 = util.makePromiseApi(ec2);

  it('should have a function that makes an AWS key/value filter', () => {
    expect(common.makeAWSFilter('t', 1)).to.be;
  });

  it('should have a function that makes an AWS VPC filter', () => {
    expect(common.makeAWSFilter(1)).to.be;
  });

  it('throwInvalidPidTag should throw', () => {
    expect(() => {
      common.throwInvalidPidTag();
    }).to.throw(Error);
  });

  it('throwInvalidPidPrTag should throw', () => {
    expect(() => {
      common.throwInvalidPidPrTag();
    }).to.throw(Error);
  });

  it('areTagsPidValid should return true if pid tags match given pid', () => {
    expect(common.areTagsPidValid('test', [{
      Key: 'red herring',
      Value: 'not useful'
    }, {
      Key: constants.PROJECT_TAG,
      Value: 'test'
    }])).to.be.true;
  });

  it('areTagsPidValid should return false if pid tags do not match given pid',
    () => {
      expect(common.areTagsPidValid('test', [{
        Key: 'red herring',
        Value: 'not useful'
      }])).to.be.false;
    });

  it('areTagsPidPrValid should return true if pid/pr tags match given pid/pr',
    () => {
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
    'given pid', () => {
    expect(common.areTagsPidPrValid('test', 'pr', [{
      Key: 'red herring',
        Value: 'not useful'
      }, {
        Key: constants.PR_TAG,
        Value: 'pr'
      }])).to.be.false;
    });

  it('areTagsPidPrValid should return false if pid/pr tags do not match ' +
    'given pr', () => {
      expect(common.areTagsPidPrValid('test', 'pr', [{
        Key: 'red herring',
        Value: 'not useful'
      }, {
        Key: constants.PROJECT_TAG,
        Value: 'test'
      }])).to.be.false;
    });

  it('awsTagEc2 should return a promise if given a resource string, and ' +
    'a tags array', () => {
      expect(typeof common.awsTagEc2(ec2, 'test', []).then).
      to.equal('function');
    });

  it('awsTagEc2 should return a promise if given a resource array, and ' +
    'a tags array', () => {
      expect(typeof common.awsTagEc2(ec2, ['test'], []).then).
      to.equal('function');
    });

  it('makeEc2DescribeFn should return a function that plucks the expected ' +
    'result value from an ec2 describe call', (done) => {
      var descFn = common.makeEc2DescribeFn({
        test: () => {
          return Q.resolve({
            demo: 'result!'
          });
        }
      }, 'test', 'demo', []);
      descFn().then((result) => {
        C.check(done, () => {
          expect(result).to.equal('result!');
        });
      }, C.getFail(done));
    });
});

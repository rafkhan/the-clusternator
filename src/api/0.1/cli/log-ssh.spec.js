'use strict';

const Q = require('q');
const rewire = require('rewire');

const l = rewire('./log-ssh');
const C = require('../../../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('CLI: log-ssh middleware', () => {
  let oldCn;
  let result = [];
  let fns = ['listSSHAbleInstances'];
  beforeEach(() => {
    oldCn = l.__get__('cn');
    l.__set__('cn', {
      describeServices: () => result instanceof Error ?
        Q.reject(result) : Q.resolve(result)
    });
  });

  afterEach(() => {
    l.__set__('cn', oldCn);
    result = [];
  });

  fns.forEach((fn) => {
    it(`${fn} should resolve if clusternator API resolves`, (done) => {
      C.check(l[fn], done);
    });

    it(`${fn} should swallow rejections if clusternator API rejects ` +
      '(CLI Endpoint)', (done) => {
      result  = new Error('test');
      C.check(l[fn], done);
    });

  });

});

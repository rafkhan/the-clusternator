'use strict';

const Q = require('q');
const rewire = require('rewire');

const p = rewire('./project');
const C = require('../../../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('CLI: project init middleware', () => {
  let oldCn, result = [], fns = ['init'];
  beforeEach(() => {
    oldCn = p.__get__('cn');
    p.__set__('cn', {
      describeServices: () => result instanceof Error ?
        Q.reject(result) : Q.resolve(result)
    });
  });

  afterEach(() => {
    p.__set__('cn', oldCn);
    result = [];
  });

  fns.forEach((fn) => {
    it(`${fn} should resolve if clusternator API resolves`, (done) => {
      C.check(p[fn], done);
    });

    it(`${fn} should swallow rejections if clusternator API rejects ` +
      '(CLI Endpoint)', (done) => {
      result  = new Error('test');
      C.check(p[fn], done);
    });

  });

});

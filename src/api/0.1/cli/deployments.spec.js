'use strict';

const Q = require('q');
const rewire = require('rewire');

const d = rewire('./deployments');
const C = require('../../../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('CLI: deployments middleware', () => {
  let oldCn;
  let result = [];
  let fns = ['deploy', 'update', 'stop'];
  beforeEach(() => {
    oldCn = d.__get__('cn');
    d.__set__('cn', {
      update: () => result instanceof Error ?
        Q.reject(result) : Q.resolve(result),
      stop: () => result instanceof Error ?
        Q.reject(result) : Q.resolve(result),
      deploy: () => result instanceof Error ?
        Q.reject(result) : Q.resolve(result)
    });
  });

  afterEach(() => {
    d.__set__('cn', oldCn);
    result = [];
  });

  fns.forEach((fn) => {
    it(`${fn} should resolve if clusternator API resolves`, (done) => {
      C.check(d[fn], done);
    });

    it(`${fn} should swallow rejections if clusternator API rejects ` +
      '(CLI Endpoint)', (done) => {
      result  = new Error('test');
      C.check(d[fn], done);
    });

  });

});

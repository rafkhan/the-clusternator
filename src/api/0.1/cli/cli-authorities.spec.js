'use strict';

const Q = require('q');
const rewire = require('rewire');

const a = rewire('./cli-authorities');
const C = require('../../../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('CLI Authorities Middleware', () => {
  let oldCn, authorities = [];
  beforeEach(() => {
    oldCn = a.__get__('cn');
    a.__set__('cn', {
      listAuthorities: () => authorities instanceof Error ?
        Q.reject(authorities) : Q.resolve(authorities)
    });
  });

  afterEach(() => {
    a.__set__('cn', oldCn);
    authorities = [];
  });

  it('listAuthorities should resolve if clusternator API resolves', (done) => {
    C.checkResolve(a.list, done);
  });

  it('listAuthorities should swallow rejections if clusternator API rejects ' +
    '(CLI Endpoint)', (done) => {
    authorities = new Error('test');
    C.checkResolve(a.list, done);
  });

});

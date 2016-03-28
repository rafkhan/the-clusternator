'use strict';

const Q = require('q');
const rewire = require('rewire');

const a = rewire('./cli-authorities');
const C = require('../../../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('CLI Authorities Middleware', () => {
  let oldCn;
  let authorities = [];
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
});

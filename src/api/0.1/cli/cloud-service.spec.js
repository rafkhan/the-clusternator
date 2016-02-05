'use strict';

const Q = require('q');
const rewire = require('rewire');

const c = rewire('./cloud-service');
const C = require('../../../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('CLI Cloud Services', () => {
  let oldCn, services = [];
  beforeEach(() => {
    oldCn = c.__get__('cn');
    c.__set__('cn', {
      describeServices: () => services instanceof Error ?
        Q.reject(services) : Q.resolve(services)
    });
  });

  afterEach(() => {
    c.__set__('cn', oldCn);
    services = [];
  });

  it('describeServices should resolve if clusternator API resolves', (done) => {
    C.check(c.describeServices, done);
  });

  it('describeServices should swallow rejections if clusternator API rejects ' +
    '(CLI Endpoint)', (done) => {
    services  = new Error('test');
    C.check(c.describeServices, done);
  });

});

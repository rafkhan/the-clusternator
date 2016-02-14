'use strict';

const Q = require('q');
const rewire = require('rewire');

const u = rewire('./user');
const C = require('../../../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('CLI: user middleware', () => {
  let oldCn;
  let oldUtil;
  let result = [];
  let promptResult = {};
  let fns = [
    'createUser', 'login', 'changePassword', 'checkConfigured',
    'checkConfiguredAndLoggedIn'
  ];
  beforeEach(() => {
    oldCn = u.__get__('cn');
    oldUtil = u.__get__('util');
    u.__set__('cn', {
      login: () => result instanceof Error ?
        Q.reject(result) : Q.resolve(result)
    });
    u.__set__('util', {
      inquirerPrompt: () => promptResult instanceof Error ?
        Q.reject(result) : Q.resolve(result)
    });
  });

  afterEach(() => {
    u.__set__('cn', oldCn);
    result = [];
  });

  fns.forEach((fn) => {
    it(`${fn} should resolve if clusternator API resolves`, (done) => {
      C.check(u[fn], done);
    });

    it(`${fn} should swallow rejections if clusternator API rejects ` +
      '(CLI Endpoint)', (done) => {
      result  = new Error('test');
      C.check(u[fn], done);
    });

  });

});

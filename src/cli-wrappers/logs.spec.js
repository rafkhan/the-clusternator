'use strict';

const rewire = require('rewire');
const Q = require('q');

const logs = rewire('./logs');
const C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('Test logs CLI Wrapper', () => {
  let cProc;

  beforeEach(() => {
    cProc = logs.__get__('cproc');
    logs.__set__('cproc', {output: Q.resolve, inherit: Q.resolve});
  });

  afterEach(() => {
    logs.__set__('cproc', cProc);
  });

  it('logApp should resolve if there are no exit errors', (done) => {
    logs
      .logApp('host')
      .then(() =>
        C.check(done, () => expect(true).to.be.ok))
      .fail(C.getFail(done));
  });

  it('logApp should throw if given no host', () => {
    expect(() => logs.logApp()).to.throw(Error);
  });

  it('logEcs should resolve if there are no exit errors', (done) => {
    logs
      .logEcs('host')
      .then(() =>
        C.check(done, () => expect(true).to.be.ok))
      .fail(C.getFail(done));
  });

  it('logEcs, genSha should throw if given no host', () => {
    expect(() => logs.logEcs()).to.throw(Error);
  });
});

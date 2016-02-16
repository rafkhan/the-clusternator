'use strict';

const rewire = require('rewire');
const Q = require('q');

const npm = rewire('./npm');
const C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('Test npm CLI Wrapper', () => {
  let cProc;

  beforeEach(() => {
    cProc = npm.__get__('cproc');
    npm.__set__('cproc', {output: Q.resolve, stream: Q.resolve});
  });

  afterEach(() => {
    npm.__set__('cproc', cProc);
  });


  it('install should resolve if there are no exit errors', (done) => {
    npm
      .install()
      .then(() =>
        C.check(done, () => expect(true).to.be.ok))
      .fail(C.getFail(done));
  });

  it('buildshould resolve if there are no exit errors', (done) => {
    npm
      .build()
      .then(() =>
        C.check(done, () => expect(true).to.be.ok))
      .fail(C.getFail(done));
  });
});

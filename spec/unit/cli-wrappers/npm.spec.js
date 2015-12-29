'use strict';

const rewire = require('rewire'),
  Q = require('Q');

var npm = rewire('../../../src/cli-wrappers/npm'),
  C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test npm CLI Wrapper', () => {
  var cProc;

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

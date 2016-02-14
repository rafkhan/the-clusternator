'use strict';

const rewire = require('rewire');
const Q = require('q');

const gps = rewire('./generate-private-sha');
const C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test generate-private-sha CLI Wrapper', () => {
  let cProc;

  beforeEach(() => {
    cProc = gps.__get__('cproc');
    gps.__set__('cproc', {output: Q.resolve, stream: Q.resolve});
  });

  afterEach(() => {
    gps.__set__('cproc', cProc);
  });

  it('genSha should resolve if there are no exit errors', (done) => {
    gps
      .genSha('path/to/thing')
      .then(() =>
        C.check(done, () => expect(true).to.be.ok))
      .fail(C.getFail(done));
  });

  it('genSha should throw if given no tag', () => {
    expect(() => gps.genSha()).to.throw(Error);
  });
});

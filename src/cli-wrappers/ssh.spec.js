'use strict';

const rewire = require('rewire');
const Q = require('q');

const ssh = rewire('./ssh');
const C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test ssh CLI Wrapper', () => {
  let cProc;

  beforeEach(() => {
    cProc = ssh.__get__('cproc');
    ssh.__set__('cproc', {output: Q.resolve, inherit: Q.resolve});
  });

  afterEach(() => {
    ssh.__set__('cproc', cProc);
  });

  it('shell should resolve if there are no exit errors', (done) => {
    ssh
      .shell()
      .then(() =>
        C.check(done, () => expect(true).to.be.ok))
      .fail(C.getFail(done));
  });

});

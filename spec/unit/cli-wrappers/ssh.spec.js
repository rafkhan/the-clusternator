'use strict';

const rewire = require('rewire'),
  Q = require('Q');

var ssh = rewire('../../../src/cli-wrappers/ssh'),
  C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test ssh CLI Wrapper', () => {
  var cProc;

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

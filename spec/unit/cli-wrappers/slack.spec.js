'use strict';

const rewire = require('rewire'),
  Q = require('Q');

var slack = rewire('../../../src/cli-wrappers/slack'),
  C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test slack CLI Wrapper', () => {
  var cProc;

  beforeEach(() => {
    cProc = slack.__get__('cproc');
    slack.__set__('cproc', {output: Q.resolve, stream: Q.resolve});
  });

  afterEach(() => {
    slack.__set__('cproc', cProc);
  });

  it('message should resolve if there are no exit errors', (done) => {
    slack
      .message('some message', 'some channel')
      .then(() =>
        C.check(done, () => expect(true).to.be.ok))
      .fail(C.getFail(done));
  });

  it('message should throw if given no message', () => {
    expect(() => slack.message()).to.throw(Error);
  });

  it('message should throw if given no channel', () => {
    expect(() => slack.message('hah')).to.throw(Error);
  });

});

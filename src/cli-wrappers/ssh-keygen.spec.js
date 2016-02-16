'use strict';

const rewire = require('rewire');
const Q = require('q');
const mockFs = require('mock-fs');

const sshKeygen = rewire('./ssh-keygen');
const C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('Test sshKeygen CLI Wrapper', () => {
  let cProc;
  let mpk;

  beforeEach(() => {
    cProc = sshKeygen.__get__('cproc');
    mpk = sshKeygen.__get__('movePublicKey');
    sshKeygen.__set__('cproc', {output: Q.resolve, inherit: Q.resolve});
    sshKeygen.__set__('movePublicKey', Q.resolve);

  });

  afterEach(() => {
    sshKeygen.__set__('cproc', cProc);
    sshKeygen.__set__('movePublicKey', mpk);
  });

  it('sshKeygen should resolve if there are no exit errors', (done) => {
    sshKeygen('name', require('os').tmpdir())
      .then(() => C
        .check(done, () => expect(true).to.be.ok))
      .fail(C.getFail(done));
  });

  it('sshKeygen should throw if given no name', () => {
    expect(() => sshKeygen()).to.throw(Error);
  });
  it('sshKeygen should throw if given no path', () => {
    expect(() => sshKeygen('name')).to.throw(Error);
  });
});

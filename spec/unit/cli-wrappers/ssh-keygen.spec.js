'use strict';

var rewire = require('rewire'),
  Q = require('q'),
  mockFs = require('mock-fs');

var sshKeygen = rewire('../../../src/cli-wrappers/ssh-keygen'),
  C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test sshKeygen CLI Wrapper', () => {
  var cProc;

  beforeEach(() => {
    cProc = sshKeygen.__get__('cproc');
    sshKeygen.__set__('cproc', {output: Q.resolve, inherit: Q.resolve});
    let home = require('os').homedir(),
      tmp = require('os').tmpdir(),
      fs = {};

    fs[home] = {
      '.ssh':{
        'name.pub': new Buffer([2,3,2])
      }
    };
    fs[tmp] = {};

    mockFs(fs);
  });

  afterEach(() => {
    mockFs.restore();
    sshKeygen.__set__('cproc', cProc);
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

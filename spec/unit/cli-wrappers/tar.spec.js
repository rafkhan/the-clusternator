'use strict';

var rewire = require('rewire'),
  Q = require('q');

var tar = rewire('../../../src/cli-wrappers/tar'),
  C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test tar CLI Wrapper', () => {
  var cProc;

  beforeEach(() => {
    cProc = tar.__get__('cproc');
    tar.__set__('cproc', {output: Q.resolve, stream: Q.resolve});
  });

  afterEach(() => {
    tar.__set__('cproc', cProc);
  });

  it('addExtension should add .tar.gz to a given filePath', () => {
    expect(tar.helpers.addExtension('test')).to.equal('test.tar.gz');
  });

  it('addExtension should *not* add .tar.gz to a given filePath *if* it ' +
    'already *ends* with a .tar.gz extension', () => {
      expect(tar.helpers.addExtension('test')).to.equal('test.tar.gz');
    });

  it('addExtension should add .tar.gz to a given filePath *if* it has ' +
    '.tar.gz *in* the file name (not at the end)', () => {
      expect(tar.helpers.addExtension('te.tar.gzst')).
      to.equal('te.tar.gzst.tar.gz');
    });

  it('addExtension should add a .gz if the given filePath ends in .tar', () => {
    expect(tar.helpers.addExtension('test.tar')).to.equal('test.tar.gz');
  });

  it('addExtension should add a .tar.gz if the given filePath contains a ' +
    '.tar somewhere in it (not at the end)', () => {
      expect(tar.helpers.addExtension('te.tarst')).to.equal('te.tarst.tar.gz');
    });

  it('ball should resolve if there are no exit errors', (done) => {
    tar.ball('testBall', 'someFile').then(() => {
      C.check(done, () => {
        expect(true).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('extract resolve if there are no exit errors', (done) => {
    tar.extract('testBall').then(() => {
      C.check(done, () => {
        expect(true).to.be.ok;
      });
    }, C.getFail(done));
  });

});

'use strict';

var rewire = require('rewire'),
  mockSpawn = require('mock-spawn');

var tar = rewire('../../src/cli-wrappers/tar'),
  C = require('./chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test tar CLI Wrapper', () => {
  beforeEach(() => {
    tar.__set__('spawn', mockSpawn());
  });

  afterEach(() => {
    tar.__set__('spawn', require('child_process').spawn);
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

  describe('cases with exit code', () => {

    beforeEach(() => {
      var ms = mockSpawn(),
        runner = ms.simple(1, '');

      runner.stderr = 'test error';
      ms.setDefault(runner);
      tar.__set__('spawn', ms);
    });

    it('ball should reject if there are exit errors', (done) => {
      tar.ball('testBall', 'someFile').then(C.getFail(done), (err) => {
        C.check(done, () => {
          expect(err instanceof Error).to.be.ok;
        });
      });
    });

    it('extract reject if there are exit errors', (done) => {
      tar.extract('testBall').then(C.getFail(done), (err) => {
        C.check(done, () => {
          expect(err instanceof Error).to.be.ok;
        });
      });
    });
  });
});

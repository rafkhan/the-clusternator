'use strict';

var rewire = require('rewire'),
  mockSpawn = require('mock-spawn'),
  fs = require('fs'),
  mockFs = require('mock-fs'),
  Q = require('q');

var git = rewire('../../../src/cli-wrappers/git'),
  C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test git CLI Wrapper', () => {
  var oldCJson, projectRoot = '/';

  beforeEach(() => {
    projectRoot = '/';
    git.__set__('spawn', mockSpawn());
    oldCJson = git.__get__('clusternatorJson');
    git.__set__('clusternatorJson', {
      findProjectRoot: () => {
        return Q.resolve(projectRoot);
      }
    });
    mockFs({
      '/.gitignore':  new Buffer([ 1, 2, 3])
    });
  });

  afterEach(() => {
    git.__set__('spawn', require('child_process').spawn);
    git.__set__('clusternatorJson', oldCJson);
    mockFs.restore();
  });


  it('shaHead should resolve if there are no exit errors', (done) => {
    git.shaHead().then(() => {
      C.check(done, () => {
        expect(true).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('clone should resolve if there are no exit errors', (done) => {
    git.clone('some-repo').then(() => {
      C.check(done, () => {
        expect(true).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('clonse should throw if not given a repo', () => {
    expect(() => {
      git.clone();
    }).to.throw(TypeError);
  });


  describe('cases with exit code', () => {

    beforeEach(() => {
      var ms = mockSpawn(),
        runner = ms.simple(1, '');

      runner.stderr = 'test error';
      ms.setDefault(runner);
      git.__set__('spawn', ms);
    });

    it('shaHead should reject if there are exit errors', (done) => {
      git.shaHead().then(C.getFail(done), (err) => {
        C.check(done, () => {
          expect(err instanceof Error).to.be.ok;
        });
      });
    });

    it('clone should reject if there are exit errors', (done) => {
      git.clone('a-repo').then(C.getFail(done), (err) => {
        C.check(done, () => {
          expect(err instanceof Error).to.be.ok;
        });
      });
    });
  });

});

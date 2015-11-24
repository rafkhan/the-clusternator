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

  it('gitIgnoreHasItem should return true if a string *starts* a line in an' +
    ' array of strings', () => {
    expect(
      git.helpers.gitIgnoreHasItem('test', ['a', 'b', 'c', 'test235', 'd'])
    ).to.be.ok;
  });

  it('gitIgnoreHasItem should return false if no strings are found', () => {
    expect(
      git.helpers.gitIgnoreHasItem('test', ['a', 'b', 'c', '23test', 'd'])
    ).to.not.be.ok;
  });

  it('readGitIgnore should resolve an array of strings', (done) => {
    git.helpers.readGitIgnore().then((result) => {
      C.check(done, () => {
        expect(Array.isArray(result)).to.be.ok;
        expect(typeof result[0]).to.equal('string');
      });
    }, C.getFail(done));
  });

  it('readGitIgnore should resolve even if there is not .gitignore', (done) => {
    projectRoot = 'some/invalid/path';
    git.helpers.readGitIgnore().then((result) => {
      C.check(done, () => {
        expect(Array.isArray(result)).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('addToGitIgnore should add a *new* entry to the .gitignore file',
    (done) => {
    git.addToGitIgnore('someFile').then(() => {
      fs.readFile('/.gitignore', 'utf8', (err, file) => {
        if (err) {
          C.getFail(done)(err);
          return;
        }
        var ignores = file.split('\n');
        C.check(done, () => {
          expect(git.helpers.gitIgnoreHasItem('someFile', ignores)).to.be.ok;
        });
      });
    }, C.getFail(done));
  });

  it('addToGitIgnore should resolve if an entry already exists',
    (done) => {
      git.addToGitIgnore('someFile').then(() => {
        return git.addToGitIgnore('someFile').then(() => {
          C.check(done, () => {
            expect(true).to.be.ok;
          });
        });
      }, C.getFail(done));
    });

});

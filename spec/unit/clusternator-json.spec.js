'use strict';

var rewire = require('rewire'),
  Q = require('q'),
  mockFs = require('mock-fs');

var cn = rewire('../../src/clusternator-json'),
  C = require('./chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('clusternator.json handling', () => {
  var project, other, oldGit, oldInq, mockGitResponse;

  function mockGit() {
    if (mockGitResponse instanceof Error) {
      return Q.reject(mockGitResponse);
    }
    return Q.resolve(mockGitResponse);
  }

  beforeEach(() => {
    project = 'home/user/workspaces/rangle/the-clusternator';
    other = 'home/user/workspaces/rangle/some-project/src';
    oldGit = cn.__get__('git');
    oldInq = cn.__get__('inquirer');
    cn.__set__('git', mockGit);
    cn.__set__('inquirer', { prompt: (p, cb) => { cb(); } });

    mockFs({
      'home/user/workspaces/rangle/the-clusternator': {
        '.git': {
          'config': new Buffer([1, 2, 5])
        },
        'clusternator.json': new Buffer([ 1 ]),
        src: {
          components: {
          }
        }
      },
      'home/user/workspaces/rangle/the-clusternator/src/component': {},
      'home/user/workspaces/rangle/some-project/': {
        'src': {}
      },
      'home/user/workspaces/other': {}
    });
  });

  afterEach(() => {
    mockFs.restore();
    cn.__set__('git', oldGit);
    cn.__set__('inquirer', oldInq);
  });

  it('parent should return the full path to a parent folder', () => {
    expect(cn.helpers.parent('/a/b')).to.equal('/a');
  });

  it('parent should return the relative path to a parent folder', () => {
    expect(cn.helpers.parent('a/b')).to.equal('a');
  });

  it('parent should return falsey if the path is root', () => {
    expect(cn.helpers.parent('/a/')).to.not.be;
  });

  it('findProjectRoot should resolve the cwd if it has a .git folder in it', (done) => {
    cn.findProjectRoot(project).then((root) => {
      C.check(done, () => {
        expect(root).to.equal(project);
      });
    }, C.getFail(done));
  });

  it('findProjectRoot should resolve the project root from a sub directory', (done) => {
    cn.findProjectRoot(project + '/src/components/').then((root) => {
      C.check(done, () => {
        expect(root).to.equal(project);
      });
    }, C.getFail(done));
  });

  it('findProjectRoot should reject if it cannot find a .git folder in the parent directories ', (done) => {
    cn.findProjectRoot(other).then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('parseGitUrl should return the last part of the git url', () => {
    expect(cn.helpers.parseGitUrl('https://github.com/rangle/the-clusternator')).to.equal(
      'the-clusternator'
    );
  });

  it('paseGitUrl should return the last part of the git url *without* the .git', () => {
    expect(cn.helpers.parseGitUrl('https://github.com/rangle/the-clusternator.git')).to.equal(
      'the-clusternator'
    );
  });

  it('findGitName should reject if given an unexpected object', (done) => {
    mockGitResponse = {};
    cn.helpers.findGitName('some/path').then(C.getFail(done), (err) => {
      C.check(done, () => {
          expect(err instanceof Error).to.be.true;
      });
    });
  });

  it('findGitName should resolve if given an expected object', (done) => {
    mockGitResponse = { 'remote "origin"': { url: 'ssh://path/to/project.git' }};
    cn.helpers.findGitName('some/path').then((name) => {
      C.check(done, () => {
        expect(name).to.equal('project');
      });
    }, C.getFail(done));
  });

  it('deDupe should remove duplicates, and falseys from an array of strings', () => {
    var tryMe = ['a', 'a', '', '', '', 'b', 'c','d','e','e','e'];
    expect(cn.helpers.deDupe(tryMe).toString()).to.equal(['a', 'b', 'c', 'd', 'e'].toString());
  });

  it('findPackageName should return falsey if package.json cannot be parsed', () => {
    expect(cn.helpers.findPackageName('a')).to.not.be.ok;
  });

  it('findBowerName should return falsey if bower.json cannot be parsed', () => {
    expect(cn.helpers.findBowerName('a')).to.not.be.ok;
  });

  it('findProjectNames should resolve an array of strings', (done) => {
    cn.findProjectNames('some/path').then((results) => {
      C.check(done, () => {
        expect(Array.isArray(results)).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('findProjectNames should resolve an array of strings if gitName search fails', (done) => {
    mockGitResponse = new Error('git fail!');
    cn.findProjectNames('some/path').then((results) => {
      C.check(done, () => {
        expect(Array.isArray(results)).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('validate should return an object with specifics about exactly what is invalid', () => {
    expect(cn.validate({}).projectId).to.be.ok;
  });

  it('validate should return an object *without* an "ok" boolean if the structure is not okay', () => {
    expect(cn.validate({ appDefs: {} }).ok).to.not.be.ok;
  });

  it('validate should return an object with an "ok" boolean if the structure is valid', () => {
    expect(cn.validate({
      projectId: 'test-project',
      appDefs: {
        pr: 'path/to/appDef'
      }
    }).ok).to.be.ok;
  });

  it('createInteractive should return a resolving promise', (done) => {
    cn.createInteractive().then(() => {
      C.check(done, () => {
        expect(true).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('answersToClusternatorJSON should return a string if given the correct arguments', () => {
    expect(typeof cn.helpers.answersToClusternatorJSON({ projectId: 'test', appDefPr: 'hi'})).to.equal('string');
  });

  it('skipIfExists should resolve if a clusternator.json file does not exist', (done) => {
    cn.skipIfExists('/some/fake/path').then(() => {
      C.check(done, () => {
        expect(true).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('skipIfExists should reject if a clusternator.json file exists', (done) => {
    cn.skipIfExists(project).then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });
  });

  it('writeFromFullAnswers should return a promise', () => {
    expect(typeof cn.writeFromFullAnswers({ answers: { projectId: '', appDefPr: '' }}).then).to.equal('function');
  });
});

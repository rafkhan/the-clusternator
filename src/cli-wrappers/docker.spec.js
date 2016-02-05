'use strict';

const rewire = require('rewire'),
  Q = require('q');

var docker = rewire('./docker'),
  C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test git CLI Wrapper', () => {
  var cProc;

  beforeEach(() => {
    cProc = docker.__get__('cproc');
    docker.__set__('cproc', { output: Q.resolve, stream: Q.resolve });
  });

  afterEach(() => {
    docker.__set__('cproc', cProc);
  });

  it('push should resolve if there are no exit errors', (done) => {
    docker
      .push('blah/repo')
      .then(() =>
        C.check(done, () => expect(true).to.be.ok ))
      .fail(C.getFail(done));
  });

  it('push should throw if given no tag', () => {
    expect(() => docker.push()).to.throw(Error);
  });

  it('build should resolve if there are no exit errors', (done) => {
    docker
      .build('some/tag')
      .then(() =>
        C.check(done, () => expect(true).to.be.ok ))
      .fail(C.getFail(done));
  });

  it('build should throw if given no tag', () => {
    expect(() => docker.build()).to.throw(Error);
  });

  it('destroy should resolve if there are no exit errors', (done) => {
    docker
      .destroy('some/tag')
      .then(() =>
        C.check(done, () => expect(true).to.be.ok ))
      .fail(C.getFail(done));
  });

  it('destroy should throw if given no tag', () => {
    expect(() => docker.destroy()).to.throw(Error);
  });

});

'use strict';

var rewire = require('rewire'),
  mockSpawn = require('mock-spawn'),
  fs = require('fs'),
  mockFs = require('mock-fs');

var child = rewire('../../../src/cli-wrappers/child-process'),
  C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test git CLI Wrapper', () => {
  var projectRoot = '/';

  beforeEach(() => {
    projectRoot = '/';
    child.__set__('spawn', mockSpawn());
  });

  afterEach(() => {
    child.__set__('spawn', require('child_process').spawn);
    mockFs.restore();
  });


  it('output should resolve if there are no exit errors', (done) => {
    child.output('ls')
      .then(() => C
        .check(done, () => expect(true).to.be.ok))
      .fail(C.getFail(done));
  });

  it('quiet should resolve if there are no exit errors', (done) => {
    child.quiet('ls')
      .then(() => C
        .check(done, () => expect(true).to.be.ok))
      .fail(C.getFail(done));
  });

  it('stream should resolve if there are no exit errors', (done) => {
    child.stream('ls')
      .then(() => C
        .check(done, () => expect(true).to.be.ok))
      .fail(C.getFail(done));
  });

  it('inherit should resolve if there are no exit errors', (done) => {
    child.inherit('ls')
      .then(() => C
        .check(done, () => expect(true).to.be.ok))
      .fail(C.getFail(done));
  });

  it('stdin should resolve if there are no exit errors', (done) => {
    child.stream('ls')
      .then(() => C
        .check(done, () => expect(true).to.be.ok))
      .fail(C.getFail(done));
  });


  describe('cases with exit code', () => {

    beforeEach(() => {
      var ms = mockSpawn(),
        runner = ms.simple(1, '');

      runner.stderr = 'test error';
      ms.setDefault(runner);
      child.__set__('spawn', ms);
    });

    it('output should reject if there are exit errors', (done) => {
      child.output()
        .then(C.getFail(done))
        .fail((err) => C
          .check(done, () => expect(err instanceof Error).to.be.ok));
    });

    it('stream should reject if there are exit errors', (done) => {
      child.stream()
        .then(C.getFail(done))
        .fail((err) => C
          .check(done, () => expect(err instanceof Error).to.be.ok));
    });

    it('quiet should reject if there are exit errors', (done) => {
      child.quiet()
        .then(C.getFail(done))
        .fail((err) => C
          .check(done, () => expect(err instanceof Error).to.be.ok));
    });

    it('inherit should reject if there are exit errors', (done) => {
      child.inherit()
        .then(C.getFail(done))
        .fail((err) => C
          .check(done, () => expect(err instanceof Error).to.be.ok));
    });

  });

});

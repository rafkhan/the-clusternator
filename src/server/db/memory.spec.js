'use strict';

const rewire = require('rewire');
const memory = rewire('./memory');
const C = require('../../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('Memory DB', () => {
  describe('create function', () => {
    it('should return a function', () => {
      const create = memory.create('hello');
      expect(typeof create === 'function').to.be.ok;
    });

    it('should return a promise', () => {
      const create = memory.create('hello');
      const p = create();
      expect(typeof p.then === 'function').to.be.ok;
    });
    
    it('should create a given table', (done) => {
      const create = memory.create('test');
      create()
        .then((r) => C.check(done, () => expect(r).to.be.ok), C.getFail(done));
    });

    it('should create a given table even if it already exists', (done) => {
      const create = memory.create('test');
      create()
        .then((r) => C.check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('destroy function', () => {
    it('should return a function', () => {
      const destroy = memory.destroy('hello');
      expect(typeof destroy === 'function').to.be.ok;
    });

    it('should return a promise', () => {
      const destroy = memory.destroy('hello');
      const p = destroy();
      expect(typeof p.then === 'function').to.be.ok;
    });

    it('should destroy a given table', (done) => {
      const destroy = memory.destroy('test');
      destroy()
        .then((r) => C.check(done, () => expect(r).to.be.ok), C.getFail(done));
    });

    it('should destroy a given table even if it does not exist', (done) => {
      const destroy = memory.destroy('test');
      destroy()
        .then((r) => C.check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('accessor function', () => {
    it('should return a function', () => {
      const accessor = memory.accessor();
      expect(typeof accessor === 'function').to.be.ok;
    });

    it('should return a promise', () => {
      const accessor = memory.accessor();
      const p = accessor();
      expect(typeof p.then === 'function').to.be.ok;
    });

    it('should reject if the table does not exist', (done) => {
      const accessor = memory.accessor('test');
      accessor()
        .then(C.getFail(done), (e) => C
          .check(done, () => expect(e instanceof Error).to.be.ok));
    });

    it('should reject if not given a key', (done) => {
      const accessor = memory.accessor('test');
      memory.create('test')().then(() => accessor()
        .then(C.getFail(done), (e) => C
          .check(done, () => expect(e instanceof Error).to.be.ok)));
    });

    it('should resolve if given a key and value', (done) => {
      const accessor = memory.accessor('test', '5', 'hello');
      memory.create('test')()
        .then(() => accessor()
          .then((r) => C
            .check(done, () => expect(r).to.be.ok), C.getFail(done)));
    });
    it('should resolve if given a key', (done) => {
      const accessor = memory.accessor('test', '5');
      memory.create('test')()
        .then(() => accessor()
          .then((r) => C
            .check(done, () => expect(r).to.be.ok), C.getFail(done)));
    });
  });

  describe('list function', () => {
    it('should return a function', () => {
      const list = memory.list();
      expect(typeof list === 'function').to.be.ok;
    });

    it('should return a promise', () => {
      const list = memory.list();
      const p = list();
      expect(typeof p.then === 'function').to.be.ok;
    });
  });

  describe('key function', () => {
    it('should return a function', () => {
      expect(typeof memory.key('test', '42') === 'function').to.be.ok;
    });
  });

  describe('hashTable', () => {
    it('should return a function', () => {
      expect(typeof memory.hashTable('test') === 'function').to.be.ok;
    });
  });
});

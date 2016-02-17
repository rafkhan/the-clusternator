'use strict';

const rewire = require('rewire');
const memory = require('./memory');
const projectDb = rewire('./projects');
const C = require('../../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('Projects DB', () => {
  const identity = (i) => i;
  let db;
  let hashTable;

  beforeEach(() => {
    db = {};
    hashTable = memory.bindDb(db).hashTable('t');
  });

  describe('createMapEncrypt', () => {
    it('should return a function', () => {
      expect(typeof projectDb.createMapEncrypt() === 'function').to.be.ok;
    });
    
    it('should run the encryption function on props in props list', () => {
      const mapEncrypt = projectDb.createMapEncrypt((x) => x + 5, ['a']);
      expect(mapEncrypt(5, 'b') === 5).to.be.ok;
    });

    it('should not run the encryption function if prop is not in props list',
      () => {
        const mapEncrypt = projectDb.createMapEncrypt((x) => x + 5, ['a']);
        expect(mapEncrypt(5, 'a') === 10).to.be.ok;
    });
  });

  describe('read function', () => {
    it('should return a function', () => {
      expect(typeof projectDb.read(hashTable, identity) === 'function')
        .to.be.ok;
    });

    it('should return a function that returns a promise', () => {
      const p = projectDb.read(hashTable, identity)('test');
      expect(typeof p.then === 'function').to.be.ok;
    });
  });

  describe('write function', () => {
    it('should return a function', () => {
      expect(typeof projectDb.write(hashTable, identity, 'test', {
          id: 'test',
          repo: 'slash'
        }) === 'function')
        .to.be.ok;
    });

    it('\s returned function should return a write promise', (done) => {
      db.t = {};
      projectDb.write(hashTable, identity, 't', { id: 't', repo: 't'})()
        .then((r) => C.check(done, () => expect(r).is.ok), C.getFail(done));
    });
  });

  describe('createAccessor', () => {
    it('should return a function', () => {
      expect(typeof projectDb.createAccessor(hashTable, 'secret') ===
        'function')
        .to.be.ok;
    });

    it('\'s returned function should return a promise returning read ' +
      'function when only given a key', (done) => {
      db.t = {};
      db.t.key = '{}'; // must be valid JSON
      const accessor = projectDb.createAccessor(hashTable, 'secret');
      accessor('key')()
        .then((r) => C
          .check(done, () => expect(JSON.stringify(r) === '{}').to.be.ok),
          C.getFail(done));
    });

    it('\'s returned function should return a promise returning write ' +
      'function when given a key and value', (done) => {
      db.t = {};
      const accessor = projectDb.createAccessor(hashTable, 'secret');
      accessor('key', { id: 'key', repo: 't'})()
        .then((r) => C
          .check(done, () => expect(db.t.key).to.be.ok),
          C.getFail(done));
    });

    it('\'s returned function should return a promise returning write ' +
      'function when given only a value', (done) => {
      db.t = {};
      const accessor = projectDb.createAccessor(hashTable, 'secret');
      accessor({ id: 'key', repo: 't'})()
        .then((r) => C
          .check(done, () => expect(db.t.key).to.be.ok),
          C.getFail(done));
    });
  });

  describe('pruneRecord function', () => {
    it('should throw if not given a record', () => {
      expect(() => projectDb.pruneRecord()).to.throw(Error);
    });
    it('should throw if not given a record.key', () => {
      expect(() => projectDb.pruneRecord({ repo: 't' })).to.throw(Error);
    });

    it('should throw if not given a record.repo', () => {
      expect(() => projectDb.pruneRecord({ id: 't' })).to.throw(Error);
    });

    it('should return an object', () => {
      expect(projectDb.pruneRecord({ id: 't', repo: 't' }).id === 't').to.be.ok;
    });
  });

});
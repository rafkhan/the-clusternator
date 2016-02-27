'use strict';

const rewire = require('rewire');
const memory = require('./memory');
const dbCtl = rewire('./db-controller');
const C = require('../../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('DB Controller', () => {
  const identity = (i) => i;
  let db;
  let hashTable;

  beforeEach(() => {
    db = {};
    hashTable = memory.bindDb(db).hashTable('t');
  });

  describe('createMapEncrypt', () => {
    it('should return a function', () => {
      expect(typeof dbCtl.createMapEncrypt() === 'function').to.be.ok;
    });
    
    it('should run the encryption function on props in props list', () => {
      const mapEncrypt = dbCtl.createMapEncrypt((x) => x + 5, ['b']);
      expect(mapEncrypt(5, 'b') === '55').to.be.ok;
    });

    it('should not run the encryption function if prop is not in props list',
      () => {
        const mapEncrypt = dbCtl.createMapEncrypt((x) => {}, []);
        expect(mapEncrypt(5, 'a') === 5).to.be.ok;
    });
  });

  describe('read function', () => {
    it('should return a function', () => {
      expect(
        typeof dbCtl.read(hashTable, identity, identity) === 'function')
        .to.be.ok;
    });

    it('should return a function that returns a promise', () => {
      const p = dbCtl.read(hashTable, identity, identity, 'test')();
      expect(typeof p.then === 'function').to.be.ok;
    });

    it('should run a given postRead function', (done) => {
      let changed = false;
      db.t = {};
      db.t.test = '{}';
      dbCtl.read(hashTable, (i) => {
        changed = true;
        return i;
        }, identity, 'test')()
        .then(() => C.check(done, () => expect(changed === true).to.be.ok),
            C.getFail(done));
    });

    it('should run a given postRead function with unexpected data', (done) => {
      let changed = false;
      db.t = {};
      db.t.test = '';
      dbCtl.read(hashTable, (i) => {
          changed = true;
          return i;
        }, identity, 'test')()
        .then(() => C.check(done, () => expect(changed === true).to.be.ok),
          C.getFail(done));
    });
  });

  describe('write function', () => {
    it('should return a function', () => {
      expect(typeof dbCtl.write(hashTable, identity, identity, 'test', {
          id: 'test',
          repo: 'slash'
        }) === 'function')
        .to.be.ok;
    });

    it('\s returned function should return a write promise', (done) => {
      db.t = {};
      dbCtl.write(hashTable, identity, identity, 't', {
        id: 't', repo: 't'
      })()
        .then((r) => C.check(done, () => expect(r).is.ok), C.getFail(done));
    });
  });

  describe('createAccessor', () => {
    it('should return a function', () => {
      expect(typeof dbCtl
          .createAccessor(hashTable, identity, identity, 'secret', []) ===
        'function')
        .to.be.ok;
    });

    it('\'s returned function should return a promise returning read ' +
      'function when only given a key', (done) => {
      db.t = {};
      db.t.key = '{}'; // must be valid JSON
      const accessor = dbCtl
        .createAccessor(hashTable, identity, identity, 'secret', []);
      accessor('key')()
        .then((r) => C
          .check(done, () => expect(JSON.stringify(r) === '{}').to.be.ok),
          C.getFail(done));
    });

    it('\'s returned function should return a promise returning read ' +
      'function when only given a key and invalid postRead', (done) => {
      db.t = {};
      db.t.key = '{}'; // must be valid JSON
      const accessor = dbCtl
        .createAccessor(hashTable, null, identity, 'secret', []);
      accessor('key')()
        .then((r) => C
          .check(done, () => expect(JSON.stringify(r) === '{}').to.be.ok),
          C.getFail(done));
    });

    it('\'s returned function should return a promise returning write ' +
      'function when given a key and value', (done) => {
      db.t = {};
      const accessor = dbCtl
        .createAccessor(hashTable, identity, identity, 'secret');
      accessor('key', { id: 'key', repo: 't'})()
        .then((r) => C
          .check(done, () => expect(db.t.key).to.be.ok),
          C.getFail(done));
    });

    it('\'s returned function should return a promise returning write ' +
      'function when given a key and value and invalid preWrite', (done) => {
      db.t = {};
      const accessor = dbCtl
        .createAccessor(hashTable, identity, null, 'secret', []);
      accessor('key', { id: 'key', repo: 't'})()
        .then((r) => C
          .check(done, () => expect(db.t.key).to.be.ok),
          C.getFail(done));
    });

    it('\'s returned function should return a promise returning write ' +
      'function when given only a value', (done) => {
      db.t = {};
      const accessor = dbCtl
        .createAccessor(hashTable, identity, identity, 'secret', []);
      accessor({ id: 'key', repo: 't'})()
        .then((r) => C
          .check(done, () => expect(db.t.key).to.be.ok),
          C.getFail(done));
    });

    it('it should encrypt expected prop', (done) => {
      db.t = {};
      const accessor = dbCtl
        .createAccessor(hashTable, identity, identity, 'secret', ['repo']);
      accessor({ id: 'key', repo: 10})()
        .then((r) => C
          .check(done, () => expect(JSON.parse(db.t.key).repo === 10)
            .not.to.be.ok),
          C.getFail(done));
    });

    it('should decrypt expected prop', (done) => {
      db.t = {};
      const accessor = dbCtl
        .createAccessor(hashTable, identity, identity, 'secret', ['repo']);

      accessor({ id: 'key', repo: 'hello'})()
        .then(() => accessor('key')()
          .then((r) => C
            .check(done, () => expect(r.repo).to.equal('hello')),
            C.getFail(done)));
    });

    it('should work without encryption', (done) => {
      db.t = {};
      const accessor = dbCtl
        .createAccessor(hashTable);

      accessor({ id: 'key', repo: 'hello'})()
        .then(() => accessor('key')()
          .then((r) => C
            .check(done, () => expect(r.repo).to.equal('hello')),
            C.getFail(done)));
    });
  });

  describe('identity function', () => {
    it('should confirm that true is true', () => {
      expect(dbCtl.identity(true) === true).to.be.ok;
    });

    it('should confirm that null is null', () => {
      expect(dbCtl.identity(null) === null).to.be.ok;
    });

    it('should confirm an object reference', () => {
      const ref = {};
      expect(dbCtl.identity(ref) === ref).to.be.ok;
    });
  });

});
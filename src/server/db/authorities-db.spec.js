'use strict';

const rewire = require('rewire');
const memory = require('./memory');
const projectDb = rewire('./authorities-db');
const C = require('../../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('Authorities DB', () => {
  let db;
  let hashTable;

  beforeEach(() => {
    db = {};
    hashTable = memory.bindDb(db).hashTable('t');
  });

  describe('createAccessor', () => {
    it('should return a function', () => {
      expect(
        typeof projectDb.createAccessor(hashTable, 'secret') === 'function')
        .to.be.ok;
    });
  });

  describe('pruneRecord function', () => {
    it('should throw if not given a record', () => {
      expect(() => projectDb.pruneRecord()).to.throw(Error);
    });
    it('should throw if not given a record.id', () => {
      expect(() => projectDb.pruneRecord({ authority: 0 })).to.throw(Error);
    });

    it('should throw if not given a record.repo', () => {
      expect(() => projectDb.pruneRecord({ id: 't' })).to.throw(Error);
    });

    it('should return an object', () => {
      expect(
        projectDb.pruneRecord({ id: 't', authority: 0 }).id === 't').to.be.ok;
    });
  });

});
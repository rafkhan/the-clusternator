'use strict';

const rewire = require('rewire');
const memory = require('./memory');
const tokensDb = rewire('./tokens-db');
const C = require('../../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('Tokens DB', () => {
  let db;
  let hashTable;

  beforeEach(() => {
    db = {};
    hashTable = memory.bindDb(db).hashTable('t');
  });

  describe('createAccessor', () => {
    it('should return a function', () => {
      expect(
        typeof tokensDb.createAccessor(hashTable, 'secret') === 'function')
        .to.be.ok;
    });
  });

  describe('pruneRecord function', () => {
    it('should throw if not given a record', () => {
      expect(() => tokensDb.pruneRecord()).to.throw(Error);
    });
    it('should throw if not given a record.id', () => {
      expect(() => tokensDb.pruneRecord({ saltedHash: 't' })).to.throw(Error);
    });
    it('should throw if not given a record.saltedHash', () => {
      expect(() => tokensDb.pruneRecord({ id: 't' }))
        .to.throw(Error);
    });

    it('should return an object', () => {
      expect(tokensDb
          .pruneRecord({ id: 't', saltedHash: 't' }).id === 't').to.be.ok;
    });
  });

});
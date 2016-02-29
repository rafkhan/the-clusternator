'use strict';

const rewire = require('rewire');
const pwDb = rewire('./passwords-db');
const C = require('../../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('Passwords DB', () => {
  let hashTable;

  describe('createAccessor', () => {
    it('should return a function', () => {
      expect(
        typeof pwDb.createAccessor(hashTable, 'secret') === 'function')
        .to.be.ok;
    });
  });

  describe('pruneRecord function', () => {
    it('should throw if not given a record', () => {
      expect(() => pwDb.pruneRecord()).to.throw(Error);
    });
    it('should throw if not given a record.id', () => {
      expect(() => pwDb.pruneRecord({ saltedHash: 't' })).to.throw(Error);
    });
    it('should throw if not given a record.saltedHash', () => {
      expect(() => pwDb.pruneRecord({ id: 't' }))
        .to.throw(Error);
    });

    it('should return an object', () => {
      expect(pwDb
          .pruneRecord({ id: 't', saltedHash: 't' }).id === 't').to.be.ok;
    });
  });

});
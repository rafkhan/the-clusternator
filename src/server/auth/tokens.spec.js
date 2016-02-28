'use strict';

const C = require('../../chai');
const rewire = require('rewire');
const tokens = rewire('./tokens');
const memory = require('../db/memory');
const testCrypto = require('./mock-crypto-hash');
const tokensDb = require('../db/tokens-db');

/*global describe, it, expect, beforeEach, afterEach */
describe('Tokens interface', function () {
  // for this.timeout to work this describe block CANNOT use an arrow
  this.timeout(10000);
  let db_ = {};
  let db;
  let oldCrypto;

  beforeEach(() => {
    db_ = { t: {}};
    const dbInt = memory.hashTable(db_, 't');
    db = tokensDb.createAccessor(dbInt, 'secret');
    oldCrypto = tokens.__get__('cryptoHash');
    tokens.__set__('cryptoHash', testCrypto);
  });
  afterEach(() => {
    tokens.__set__('cryptoHash', oldCrypto);
  });

  it('findById should resolve an array', (done) => {
    db_.t['some id'] = JSON.stringify({ id: 'some id', saltedHashes: [] });
    tokens.findById(db, 'some id').then((results) => {
      C.check(done, () => {
        expect(Array.isArray(results)).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('create should resolve a new token', (done) => {
    tokens.create(db, 'some id').then((token) => {
      C.check(done, () => {
        expect(typeof token === 'string').to.be.ok;
      });
    }, C.getFail(done));
  });

  it('created tokens should be prefixed with a user id and a colon', (done) => {
    tokens.create(db, 'some id').then((token) => {
      C.check(done, () => {
        expect(token.indexOf('some id:')).to.equal(0);
      });
    }, C.getFail(done));
  });

  it('created tokens should be validatable', (done) => {
    tokens.create(db, 'some id').then((token) => {
        return tokens.verify(db, token).then((r) => {
          C.check(done, () => {
            expect(r.index).to.equal(0);
          });
        });
      })
      .fail(C.getFail(done));
  });

  it('created tokens should be invalidatable', (done) => {
    tokens.create(db, 'some id').then((token) => {
      return tokens.invalidate(db, token).then(() => {
        return tokens.verify(db, token).then(C.getFail(done), (err) => {
          C.check(done, () => {
            expect(err instanceof Error).to.be.ok;
          });
        });
      });
    });
  });

  it('userFromToken should return a user id from a token', () => {
    expect(tokens.userFromToken('me:23523k5j2k35j2')).to.equal('me');
  });

});

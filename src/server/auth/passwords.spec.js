'use strict';

const C = require('../../chai');
const rewire = require('rewire');
const passwords = rewire('./passwords');
const memory = require('../db/memory');
const testCrypto = require('./mock-crypto-hash');
const passwordsDb = require('../db/passwords-db');

/*global describe, it, expect, beforeEach, afterEach */
describe('Passwords interface', function () {
  // for this.timeout to work this describe block CANNOT use an arrow
  this.timeout(10000);
  let db_ = {};
  let db;
  let testId = 'blah';
  let testPass1 = 'secret';
  let testPass2 = 'secret1';
  let oldCrypto;

  beforeEach(() => {
    db_ = { t: {}};
    const dbInt = memory.hashTable(db_, 't');
    db = passwordsDb.createAccessor(dbInt, 'secret');
    oldCrypto = passwords.__get__('cryptoHash');
    passwords.__set__('cryptoHash', testCrypto);
  });
  afterEach(() => {
    passwords.__set__('cryptoHash', oldCrypto);
  });

  it('find should retrieved created passwords, that have a "saltedHash"',
    (done) => {
      passwords.create(db, testId, testPass1)
        .then(() => passwords
          .find(db, testId)
          .then((testId) => C.check(done, () => {
            expect(testId.saltedHash).to.be.ok;
            expect(testId.saltedHash).to.not.equal(testPass1);
          })))
        .fail(C.getFail(done));
    });

  it('change passwords should resolve if given a valid password, and a ' +
    'new password', (done) => {
    passwords.create(db, testId, testPass1)
      .then(() => passwords
        .change(db, testId, testPass1, testPass2)
        .then(() => passwords
          .verify(db, testId, testPass2)
          .then((r) => C.check(done, () => {
            expect(r).to.be.ok;
          }))))
      .fail(C.getFail(done));
  });

  it('change passwords should reject if given an invalid password', (done) => {
    passwords.change(db, testId, testPass1, testPass2)
      .then(C.getFail(done), (err) => C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      }))
      .fail(C.getFail(done));
  });

});

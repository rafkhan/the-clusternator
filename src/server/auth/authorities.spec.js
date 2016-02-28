'use strict';
/*global describe, it, expect, require, beforeEach */

const C = require('../../chai');
const authorities = require('./authorities');
const authoritiesDb = require('../db/authorities-db');
const memory = require('../db/memory');

describe('Authorities interface', () => {
  let testId = 'blah';
  let db_ = {};
  let db;
  const mgr = 1;
  const reg = 2;

  beforeEach(() => {
    db_ = { t: {} };
    const dbInt = memory.hashTable(db_, 't');
    db = authoritiesDb.createAccessor(dbInt, 'secret');
  });

  it('create should default to regular authority', (done) => {
    let testId2 = 'hhhh';
    authorities.create(db, testId2)
      .then(() => {
        return authorities.find(db, testId2)
          .then((test) => C.check(done, () => {
            expect(test.authority).to.equal(reg);
          }));
      })
      .fail(C.getFail(done));
  });

  it('change authorities should resolve if the id exists', (done) => {
    db_.t[testId] = JSON.stringify({ id: testId, authority: 2 });
    authorities.change(db, testId, mgr)
      .then(() => authorities.find(db, testId))
      .then((a) => C.check(done, () => expect(a.authority).to.equal(mgr)))
      .fail(C.getFail(done));
  });

  it('change authorities should reject if given an invalid id', (done) => {
    authorities.change(db, 'ooga', reg)
      .then(C.getFail(done), (err) => C
        .check(done, () => expect(err instanceof Error).to.be.ok ));
  });
});

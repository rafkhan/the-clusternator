'use strict';
/*global describe, it, expect, require, beforeEach */

const C = require('../../chai');
const cmn = require('./auth-common');
const memory = require('../db/memory');

describe('Common auth functions', () => {
  let db_ = {};
  let db;

  beforeEach(() => {
    db_ = {t: {}};
    db = memory.bindDb(db_).hashTable('t');
  });

  describe('find function', () => {
    let find;

    beforeEach(() => {
      find = cmn.find;
    });

    it('find should resolve an entity if it exists in a db',
      (done) => {
        db_.t.someId = JSON.stringify({ hello: 'world' });
        find(db, 'someId')
          .then((r) => C.check(done, () => expect(r).to.be.ok),
            C.getFail(done));
      });

    it('find should reject if an entity is not found',
      (done) => {
        find(db, 'someId')
          .then(C.getFail(done), (err) => C
            .check(done, () => expect(err instanceof Error).to.be.ok));
      });

    it('find should reject if an entity is empty',
      (done) => {
        db_.t.someId = '';
        find(db, 'someId')
          .then(C.getFail(done), (err) => C
            .check(done, () => expect(err instanceof Error).to.be.ok));
      });

  });
});

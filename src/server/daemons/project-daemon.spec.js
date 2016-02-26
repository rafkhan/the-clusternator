'use strict';

const Q = require('Q');
const rewire = require('rewire');
const memory = require('../db/memory');
const pd = rewire('./project-daemon');
const C = require('../../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('Projects DB', () => {
  let db;
  let hashTable;
  let pm;
  let list = [];
  let repo;

  beforeEach(() => {
    db = {};
    hashTable = memory.bindDb(db).hashTable('projects');
    pm = {
      listProjects: () => Q.resolve(list)
    };
    repo = { protocol: 'https://', token: 'test', prefix: 'hello' };
  });

  describe('watchForExisting function', () => {
    it('should return a function', () => {
      const fn = pd(pm, hashTable);
      expect(typeof fn === 'function').to.be.ok;
      fn();
    });

    it('should return a function if called twice in a row', () => {
      const t1 = pd(pm, hashTable);
      const fn = pd(pm, hashTable);
      expect(typeof fn === 'function').to.be.ok;
      expect(t1.toString() === fn.toString()).to.be.ok;
      fn();
    });

    it('\'s returned function should be callable multiple times', () => {
      const fn = pd(pm, hashTable);
      expect(typeof fn() === 'undefined').to.be.ok;
      expect(typeof fn() === 'undefined').to.be.ok;
    });

    describe('async test', () => {
      let oldPopulate;
      let callCount = 0;

      beforeEach(() => {
        callCount = 0;
        oldPopulate = pd.__get__('populateFromAws');
        pd.__set__('populateFromAws', () => callCount += 1);
      });

      afterEach(() => {
        pd.__set__('populateFromAws', oldPopulate);
      });

      it('should call populateFromAws', (done) => {
        const stop = pd(pm, hashTable, repo,  10);
        setTimeout(() => C
          .check(done, () => expect(callCount === 1).to.be.ok && stop()), 11);
      });

      it('\s stop function should stop execution', (done) => {
        const stop = pd(pm, hashTable, repo, 50);
        setTimeout(stop, 0);
        setTimeout(() => C
          .check(done, () => expect(callCount === 0).to.be.ok), 60);
      });
    });
  });

  describe('createEntry function', () => {
    it('should return a function', () => {
      expect(typeof pd.createEntry() === 'function').to.be.ok;
    });

    it('should return a function that returns a promise', () => {
      const fn = pd.createEntry(hashTable, 'test', { repo: '', token: ''});

      expect(typeof fn().then === 'function').to.be.ok;
    });
  });

  describe('checkPrefix function', () => {
    it('should return a default string if given no params', () => {
      expect(pd.checkPrefix() === 'github.com/set-config-default-repo-prefix/')
        .to.be.ok;
    });
    it('should return a default string if given an empty array', () => {
      expect(
        pd.checkPrefix([]) === 'github.com/set-config-default-repo-prefix/')
        .to.be.ok;
    });

    it('should return a string that ends with a /', () => {
      const str = pd.checkPrefix('test');
      expect(str === 'test/').to.be.ok;
    });

    it('should return a string that ends with exactly one /', () => {
      const str = pd.checkPrefix('test/');
      expect(str === 'test/').to.be.ok;
    });
  });

  describe('getDefaultRepo function', () => {
    it('should throw without a defaultRepo', () => {
      expect(() => pd.getDefaultRepo()).to.throw(Error);
    });
    
    it('should return a string prefixed with a given token if there is a token',
      () => {
        const dr = pd.getDefaultRepo({ repo: '', token: 'hi', protocol: ''});
        expect(dr.indexOf('hi') === 0). to.be.ok;
    });
  });

  describe('populateFromAws function', () => {
    it('should return a promise', () => {
      const p = pd.populateFromAws(pm, hashTable, repo);
      expect(typeof p.then === 'function').to.be.ok;
    });

    describe('async tests', () => {
      let oldMap;
      let newMapPromise;
      beforeEach(() => {
        oldMap = pd.__get__('mapAwsPopulationPromise');
        newMapPromise = () => {};
        pd.__set__('mapAwsPopulationPromise', () => newMapPromise());
      });

      afterEach(() => {
        pd.__set__('mapAwsPopulationPromise', oldMap);
      });

      it('should resolve on failure', (done) => {
        newMapPromise = () => { throw new Error('test'); };
        pd.populateFromAws(pm, hashTable, repo)
          .then(() => C
            .check(done, (r) => expect(r === undefined).to.be.ok),
            C.getFail(done));
      });
    });
  });

  describe('mapAwsPopulationPromise function', () => {
    it('should return a function', () => {
      expect(typeof pd.mapAwsPopulationPromise(hashTable, repo) === 'function')
        .to.be.ok;
    });

    it('should return a function that returns a promise', () => {
      const p = pd.mapAwsPopulationPromise(hashTable, repo)();
      expect(typeof p.then === 'function').to.be.ok;
    });
    
    it('\'s promise should resolve if there is a db entry', (done) => {
      db.projects = {};
      db.projects.pat = {};
      pd.mapAwsPopulationPromise(hashTable, repo)('pat')
        .then(() => C
          .check(done, (r) => expect(r === undefined).to.be.ok),
          C.getFail(done));
    });


    describe('async tests', () => {
      let oldCreate;
      let createCount = 0;
      let newCreate;

      beforeEach(() => {
        let create = () => () => newCreate();
        newCreate = () => { createCount += 1; return Q.resolve(); };
        oldCreate = pd.__get__('createEntry');
        pd.__set__('createEntry', () => create());
      });

      afterEach(() => {
        pd.__set__('createEntry', oldCreate);
      });

      it('\'s promise should reject and call create, then resolve if there ' +
        'is no db entry', (done) => {
        db.projects = {};
        db.projects.pat = null;
        pd.mapAwsPopulationPromise(hashTable, repo)('pat')
          .then(() => C
            .check(done, (r) => expect(createCount === 1).to.be.ok),
            C.getFail(done));
      });
    });
  });
});
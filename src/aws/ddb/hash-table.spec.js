'use strict';

const rewire = require('rewire');
const Q = require('q');

const ht = rewire('./hash-table');
const C = require('../../chai');

const aws = {};

function initData() {
  aws.ddb = {
    listTables: () => Q.resolve({ TableNames: new Array(50) }),
    deleteTable: () => Q.resolve(),
    createTable: () => Q.resolve(),
    getItem: () => Q.resolve(),
    putItem: () => Q.resolve()
  };
}


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: DDB: HashTable', () => {

  beforeEach(initData);

  describe('accessor function', () => {
    it('should throw without a key argument', () => {
      expect(() => ht.accessor(aws, 'someTable')).to.throw(TypeError);
    });

    it('should return a promise-returning read function', () => {
      const accessorFunction = ht.accessor(aws, 'test', 'someKey');
      const accessorPromise = accessorFunction();
      expect(typeof accessorPromise.then === 'function').to.be.ok;
    });

    it('should return a promise-returning write function', () => {
      const accessorFunction = ht.accessor(aws, 'test', 'someKey', 'someVal');
      const accessorPromise = accessorFunction();
      expect(typeof accessorPromise.then === 'function').to.be.ok;
    });
  });

  describe('checkAndWrite function', () => {
    it('should return a function', () => {
      const checkAndWriteFunction = ht.helpers
        .checkAndWrite(aws, 'test', 'someKey', 77);
      expect(typeof checkAndWriteFunction === 'function').to.be.ok;
    });

    it('should throw without a key argument', () => {
      expect(() => ht.helpers.checkAndWrite(aws, 'someTable')).to
        .throw(TypeError);
    });

    it('should throw without a table argument', () => {
      expect(() => ht.helpers.checkAndWrite(aws)).to.throw(TypeError);
    });

    it('should return a promise-returning function', () => {
      aws.ddb.listTables = () => Q.resolve({
        TableNames: ['a', 'clusternator-test', 'b'] });

      const checkAndWriteFunction = ht.helpers
        .checkAndWrite(aws, 'test', 'someKey', 41);
      const checkAndWritePromise = checkAndWriteFunction();
      expect(typeof checkAndWritePromise.then === 'function').to.be.ok;
    });

    it('should still return a promise-returning function if table does not ' +
      'exist', () => {
      const checkAndWriteFunction = ht.helpers
        .checkAndWrite(aws, 'test', 'someKey', 41);
      const checkAndWritePromise = checkAndWriteFunction();
      expect(typeof checkAndWritePromise.then === 'function').to.be.ok;
    });

  });

  describe('checkIfTableExists function', () => {
    it('should return a function', () => {
      const checkIfTableExistsFunction = ht.helpers
        .checkIfTableExists(aws, 'test');
      expect(typeof checkIfTableExistsFunction === 'function').to.be.ok;
    });

    it('should throw without a table argument', () => {
      expect(() => ht.helpers.checkIfTableExists(aws)).to.throw(TypeError);
    });

    it('should resolve false if the table is not found', (done) => {
      aws.ddb = {
        listTables: () => Q.resolve({ TableNames: ['a', 'b'] })
      };
      const checkIfTableExistsFunction = ht.helpers
        .checkIfTableExists(aws, 'test');

      checkIfTableExistsFunction()
        .then((r) => C
          .check(done, () => expect(r === false).to.be.ok, C.getFail(done)));

    });

    it('should resolve true if the clusternated table is found', (done) => {
      aws.ddb = {
        listTables: () => Q.resolve({ TableNames: [
          'a', 'clusternator-test', 'b'] })
      };
      const checkIfTableExistsFunction = ht.helpers
        .checkIfTableExists(aws, 'test');

      checkIfTableExistsFunction()
        .then((r) => C
          .check(done, () => expect(r === true).to.be.ok, C.getFail(done)));

    });
  });

  describe('write function', () => {
    it('should return a function', () => {
      const writeFunction = ht.helpers.write(aws, 'test', 'someKey');
      expect(typeof writeFunction === 'function').to.be.ok;
    });

    it('should throw without a key argument', () => {
      expect(() => ht.helpers.write(aws, 'table')).to.throw(TypeError);
    });

    it('should throw without a table argument', () => {
      expect(() => ht.helpers.write(aws)).to.throw(TypeError);
    });

    it('should return a promise-returning function', () => {
      const writeFunction = ht.helpers.write(aws, 'test', 'someKey');
      const writePromise = writeFunction();
      expect(typeof writePromise.then === 'function').to.be.ok;
    });
  });

  describe('read function', () => {
    it('should return a function', () => {
      const readFunction = ht.helpers.read(aws, 'test', 'someKey');
      expect(typeof readFunction === 'function').to.be.ok;
    });

    it('should throw without a key argument', () => {
      expect(() => ht.helpers.read(aws, 'table')).to.throw(TypeError);
    });

    it('should throw without a table argument', () => {
      expect(() => ht.helpers.read(aws)).to.throw(TypeError);
    });

    it('should return a promise-returning function', () => {
      const readFunction = ht.helpers.read(aws, 'test', 'someKey');
      const readPromise = readFunction();
      expect(typeof readPromise.then === 'function').to.be.ok;
    });
  });

  describe('makeDdbItem function', () => {
    it('should stringify its given value if it is not a string', () => {
      const test = ht.helpers.makeDdbItem('5', { test: 3 });
      expect(JSON.parse(test.value.S).test === 3).to.be.ok;
    });
  });

  describe('create function', () => {
    it('should return a function', () => {
      const createFunction = ht.create(aws, 'test');
      expect(typeof createFunction === 'function').to.be.ok;
    });

    it('should throw without a table argument', () => {
      expect(() => ht.create(aws)).to.throw(TypeError);
    });

    it('should return a promise-returning function', () => {
      const createFunction = ht.create(aws, 'test');
      const createPromise = createFunction();
      expect(typeof createPromise.then === 'function').to.be.ok;
    });

    it('should resolve', (done) => {
      const createFunction = ht.create(aws, 'test');
      createFunction()
        .then(() => C.check(done, () => {
          expect(true).to.be.ok;
        }), C.getFail(done));
    });
  });

  describe('destroy function', () => {
    it('should return a function', () => {
      const destroyFunction = ht.destroy(aws, 'test');
      expect(typeof destroyFunction === 'function').to.be.ok;
    });

    it('should throw without a table argument', () => {
      expect(() => ht.destroy(aws)).to.throw(TypeError);
    });

    it('should return a promise-returning function', () => {
      const destroyFunction = ht.destroy(aws, 'test');
      const destroyPromise = destroyFunction();
      expect(typeof destroyPromise.then === 'function').to.be.ok;
    });

    it('should resolve', (done) => {
      const destroyFunction = ht.destroy(aws, 'test');
      destroyFunction()
        .then(() => C.check(done, () => {
          expect(true).to.be.ok;
        }), C.getFail(done));
    });

    it('should resolve pass or fail', (done) => {
      aws.ddb = {
        deleteTable: () => Q.reject(new Error('test')),
      };
      const destroyFunction = ht.destroy(aws, 'test table');
      destroyFunction()
        .then(() => C.check(done, () => {
          expect(true).to.be.ok;
        }), C.getFail(done));
    });
  });

  describe('list function', () => {
    it('should return a function', () => {
      const listFunction = ht.list(aws);
      expect(typeof listFunction === 'function').to.be.ok;
    });

    it('should return a promise-returning function', () => {
      const listFunction = ht.list(aws);
      const listPromise = listFunction();
      expect(typeof listPromise.then === 'function').to.be.ok;
    });

    it('should reject if TableNames not present in result', (done) => {
      aws.ddb = {
        listTables: () => Q.resolve(new Array(100))
      };
      ht.list(aws)().then(C.getFail(done), (err) => {
        C.check(done, () => {
          expect(err instanceof Error).to.be.ok;
        });
      });
    });

    it('should resolve paginated lists', (done) => {
      let times = 0;
      aws.ddb = {
        listTables: () => {
          if (times) {
            return Q.resolve({TableNames: ['a', 'b', 'c']});
          }
          times += 1;
          return Q.resolve({ TableNames: (new Array(100)).concat(['z']) });
        }
      };
      const listFunction = ht.list(aws);
      const listPromise = listFunction();
      listPromise.then((r) => {
        C.check(done, () => {
          expect(Array.isArray(r)).to.be.ok;
        });
      }, C.getFail(done));
    });
  });
});

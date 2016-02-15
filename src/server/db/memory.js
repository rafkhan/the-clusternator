'use strict';

const Q = require('q');
const R = require('ramda');
const dbs = Object.create(null);

module.exports = {
  accessor,
  create,
  destroy,
  hashTable,
  key,
  list
};

/**
 * @returns {promiseToList}
 */
function list() {
  /**
   * @returns {Promise<Array<string>>}
   */
  function promiseToList() {
    return Q.resolve(Object.keys(dbs));
  }
  return promiseToList;
}

/**
 * Returns a function that will get/set on the table/id provided.
 * @param {string} table
 * @param {string} id
 * @returns {function(string=)}
 */
function key(table, id) {
  return R.partial(accessor, [ table, id ]);
}

/**
 * Returns a function that will get/set
 * @param {string} table
 * @returns {function(string, string=)}
 */
function hashTable(table) {
  return R.partial(accessor, [ table ]);
}

/**
 * @param {string} table
 * @param {string} key
 * @param {string=} value
 * @returns {promiseToAccessTable}
 */
function accessor(table, key, value) {
  /**
   * @returns {Promise}
   */
  function promiseToAccessTable() {
    if (!dbs[table]) {
      return Q.reject(new Error(`accessor: table ${table} not found`));
    }
    if (!key) {
      return Q.reject(new Error(`accessor: requires a key value`));
    }
    if (key && value === undefined) {
      return Q.resolve(dbs[table][key]);
    }
    dbs[table][key] = value;
    return Q.resolve(dbs[table][key]);
  }
  return promiseToAccessTable;
}

/**
 * @param {string} table
 * @returns {promiseToCreate}
 */
function create(table) {
  /**
   * @returns {Promise<string>}
   */
  function promiseToCreate() {
    if (dbs[table]) {
      return Q.resolve('table exists');
    }
    dbs[table] = Object.create(null);
    return Q.resolve('table created');
  }
  return promiseToCreate;
}

/**
 * @param {string} table
 * @returns {promiseToDestroy}
 */
function destroy(table) {
  /**
   * @returns {Promise}
   */
  function promiseToDestroy() {
    if (!dbs[table]) {
      return Q.resolve('already destroyed');
    }
    delete dbs[table];
    return Q.resolve('table destroyed');
  }
  return promiseToDestroy;
}

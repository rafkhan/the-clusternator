'use strict';
/**
 * Interface to the projects database
 *
 * @module server/db/projects
 */
const ENCRYPTED_PROPS = Object.freeze(['sharedKey', 'gitHubKey']);


const R = require('ramda');
const util = require('../../util');
const crypto = require('../auth/crypto-symmetric');

module.exports.createAccessor = createAccessor;
module.exports.pruneRecord = pruneRecord;
module.exports.write = write;
module.exports.read = read;
module.exports.createMapEncrypt = createMapEncrypt;

/**
 * @param {function(string, *=)} hashTable
 * @param {string} encryptionKey
 * @returns {accessor}
 */
function createAccessor(hashTable, encryptionKey) {
  const encrypt = util.partial(crypto.encrypt, encryptionKey);
  const decrypt = util.partial(crypto.decrypt, encryptionKey);

  /**
   * @param {string|{ id: string, repo: string}} key or optionally an object
   with an id prop
   * @param {{ id: string, repo: string }=} value
   * @returns {function()}
   */
  function accessor(key, value) {
    if (value === undefined) {
      if (typeof key === 'object' && key && key.id){
        return write(hashTable, encrypt, key.id, key);
      }
      return read(hashTable, decrypt, key);
    }
    return write(hashTable, encrypt, value.id, value);
  }
  return accessor;
}

/**
 * @param {{ id: string, repo: string }} record
 * @returns {{id: string, repo: string, name: (string), sharedKey: (string),
 gitHubKey: (string), channel: string}}
 * @throws {TypeError}
 */
function pruneRecord(record) {
  const invalid = 'projects need at least an id, and repo';
  if (!record) {
    throw new TypeError(invalid);
  }
  if (!record.id || !record.repo) {
    throw new TypeError(invalid);
  }
  return {
    id: record.id,
    repo: record.repo,
    name: record.name || '',
    sharedKey: record.sharedKey || '',
    gitHubKey: record.gitHubKey || '',
    channel: record.channel || record.id
  };
}

/**
 * @param {function(string, *=)} hashTable
 * @param {function(string)} encryptionFunction
 * @param {string} id
 * @param {{ id: string, repo: string }} record
 * @returns {function(...)}
 */
function write(hashTable, encryptionFunction, id, record) {
  return hashTable(id, JSON.stringify(R
    .mapObjIndexed(createMapEncrypt(encryptionFunction, ENCRYPTED_PROPS),
      pruneRecord(record))));
}

/**
 * @param {function(string, *)} hashTable
 * @param {function(string)} decryptionFunction
 * @param {string} id
 * @returns {promiseToRead}
 */
function read(hashTable, decryptionFunction, id) {
  /**
   * @returns {Promise}
   */
  function promiseToRead() {
    return hashTable(id)()
      .then(JSON.parse)
      .then(createMapEncrypt(decryptionFunction, ENCRYPTED_PROPS));
  }
  return promiseToRead;
}

/**
 * @param {Function} encryptionFunction
 * @param {Array<string>} encryptedProps
 * @returns {mapEncrypt}
 */
function createMapEncrypt(encryptionFunction, encryptedProps) {
  /**
   * @param {*} val
   * @param {string} key
   * @returns {string}
   */
  function mapEncrypt(val, key) {
    if (encryptedProps.indexOf(key) !== 0) {
      return val;
    }
    return encryptionFunction(val);
  }
  return mapEncrypt;
}


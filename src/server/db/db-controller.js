'use strict';
/**
 * Interface to a database
 *
 * @module server/db/db-controller
 */

const R = require('ramda');
const util = require('../../util');
const crypto = require('../auth/crypto-symmetric');
const identity = i => i;

module.exports.identity = identity;
module.exports.createAccessor = createAccessor;
module.exports.write = write;
module.exports.read = read;
module.exports.createMapEncrypt = createMapEncrypt;

/**
 * @param {function(string, *=)} hashTable
 * @param {function(Object)=} preWrite called before writes (validator)
 * @param {function(Object)=} postRead called after reads
 * @param {string=} encryptionKey
 * @param {Array.<string>=} encryptProps props to encrypt
 * @returns {accessor}
 */
function createAccessor(hashTable, preWrite, postRead, encryptionKey,
                        encryptProps) {
  preWrite = typeof preWrite === 'function' ? preWrite : identity;
  postRead = typeof postRead === 'function' ? postRead : identity;
  encryptProps = Array.isArray(encryptProps) ? encryptProps : [];
  encryptionKey = encryptionKey || '';

  let encrypt;
  let decrypt;
  if (encryptionKey) {
    encrypt = util.partial(crypto.encrypt, encryptionKey);
    decrypt = util.partial(crypto.decrypt, encryptionKey);
  } else {
    encrypt = identity;
    decrypt = identity;
  }
  const mapEncrypt = createMapEncrypt(encrypt, encryptProps);
  const mapDecrypt = createMapEncrypt(decrypt, encryptProps);


  /**
   * @param {string|{ id: string, repo: string}} key or optionally an object
   with an id prop
   * @param {{ id: string, repo: string }=} value
   * @returns {function(...):Promise}
   */
  function accessor(key, value) {
    if (value === undefined) {
      if (typeof key === 'object' && key && key.id){
        return write(hashTable, preWrite, mapEncrypt, key.id, key);
      }
      return read(hashTable, postRead, mapDecrypt, key);
    }
    return write(hashTable, preWrite, mapEncrypt, value.id, value);
  }
  return accessor;
}

/**
 * @param {function(string, *=)} hashTable
 * @param {function(*)} preWriteFunction
 * @param {function(string)} mapEncrypt
 * @param {string} id
 * @param {{ id: string, repo: string }} record
 * @returns {function(...)}
 */
function write(hashTable, preWriteFunction, mapEncrypt, id, record) {
  return hashTable(id, JSON.stringify(R
    .mapObjIndexed(mapEncrypt, preWriteFunction(record))));
}

/**
 * @param {function(string, *)} hashTable
 * @param {function(string)} mapDecrypt
 * @param {function(Object): Object} postRead
 * @param {string} id
 * @returns {promiseToRead}
 */
function read(hashTable, postRead, mapDecrypt, id) {
  /**
   * @returns {Promise}
   */
  const mapObjectDecrypt = R.mapObjIndexed(mapDecrypt);
  function promiseToRead() {
    return hashTable(id)()
      .then((record) => record ? JSON.parse(record) : {})
      .then(mapObjectDecrypt)
      .then(postRead);
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
    if (encryptedProps.indexOf(key) === -1) {
      return val;
    }
    /** @todo detect string|buffer */
    // encryption function expects string|buffer
    return encryptionFunction(val + '');
  }
  return mapEncrypt;
}


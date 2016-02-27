'use strict';
/**
 * Interface to the tokens database
 *
 * @module server/db/tokens
 */
const ENCRYPTED_PROPS = Object.freeze(['sharedKey', 'gitHubKey']);

const dbCtl = require('./db-controller');
const util = require('../../util');

module.exports.createAccessor = createAccessor;
module.exports.pruneRecord = pruneRecord;

/**
 * @param {function(string, *=)} hashTable
 * @param {string} encryptionKey
 * @returns {accessor}
 */
function createAccessor(hashTable, encryptionKey) {
  return dbCtl.createAccessor(hashTable, pruneRecord, null, encryptionKey,
    ENCRYPTED_PROPS);
}

/**
 * @param {{ id: string, saltedHash: string }} record
 * @returns {{id: string, saltedHash: string}}
 * @throws {TypeError}
 */
function pruneRecord(record) {
  const invalid = 'tokens have an id and saltedHash';
  if (!record) {
    throw new TypeError(invalid);
  }
  if (!record.id || !record.saltedHash) {
    throw new TypeError(invalid);
  }
  return {
    id: record.id,
    saltedHash: record.saltedHash
  };
}


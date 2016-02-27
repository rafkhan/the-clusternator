'use strict';
/**
 * Interface to the authorities database
 *
 * @module server/db/authorities
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
 * @param {{ id: string, repo: string }} record
 * @returns {{id: string, authority: number }}
 * @throws {TypeError}
 */
function pruneRecord(record) {
  const invalid = 'authorities need at least an id, and authority number';
  if (!record) {
    throw new TypeError(invalid);
  }
  if (!record.id || typeof record.authority !== 'number') {
    throw new TypeError(invalid);
  }

  return {
    id: record.id,
    authority: record.authority
  };
}


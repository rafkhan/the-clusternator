'use strict';
/**
 * Interface to the projects database
 *
 * @module server/db/projects
 */
const POLL_INTERVAL = 30000;
const ENCRYPTED_PROPS = Object.freeze(['sharedKey', 'gitHubKey']);

const R = require('ramda');
const Q = require('q');

const util = require('../../util');
const crypto = require('../auth/crypto-symmetric');

const pruneAndStringify = R.compose(JSON.stringify, pruneRecord);

module.exports = getProjectsDB;
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
  const encrypt = R.partial(crypto.encrypt, encryptionKey);
  const decrypt = R.partial(crypto.decrypt, encryptionKey);

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

/**
 * Returns an interface to a projectDb
 * @param {Object} config
 * @param {Object} pm
 * @returns {{find: find, create: create, getItem: getItem, setItem: setItem,
 list: list, init: *}}
 */
function getProjectsDB(config, pm) {
  const encrypt = R.partial(crypto.encrypt, config.dbKey);
  const decrypt = R.partial(crypto.decrypt, config.dbKey);

  const db = Object.create(null);
  const init = populateFromAWS()
    .fail((err) => {
      util.error('Projects: Failed to populate existing resources', err);
    });

  poll();

  function poll() {
    setInterval(populateFromAWS, POLL_INTERVAL);
  }

  function checkPrefix(prefix) {
    if (!prefix || prefix.length < 1) {
      return 'github.com/set-config-default-repo-prefix/';
    }
    return prefix[prefix.length - 1] === '/' ? prefix : prefix + '/';
  }

  function getDefaultRepo(name) {
    if (!config.defaultRepo) {
      throw new Error('Projects: Default repository not configured');
    }
    const secret = config.defaultRepo.token ?
    config.defaultRepo.token + '@' : '';

    return config.defaultRepo.protocol + secret +
      checkPrefix(config.defaultRepo.prefix) + name + '.git';
  }

  function populateFromAWS() {
    return pm
      .listProjects()
      .then((list) => {
        return Q.all([list.map((name) => {
          return find(name)
            .fail(() => {
              return create({
                id: name,
                repo: getDefaultRepo(name)
              })
                .then(() => {
                  util.info(`Found Resources For Project: ${name} but no ` +
                    `database entry.  Added new db entry for ${name}`);
                })
                .fail((err) => {
                  util.error(`Found Resources For Project: ${name} but no` +
                  `database entry.  Failed: ${err.message}`);
                });
            });
        })]);
      });
  }

  function find(id) {
    return getItem(id);
  }

  function getItem(id) {
    if (db[id]) {
      return Q.resolve(R.mapObjIndexed(mapDecrypt, db[id]));
    }
    return Q.reject(new Error(`${id} not found`));
  }

  /**
   * @param {*} val
   * @param {string} key
   * @returns {string}
   */
  function mapEncrypt(val, key) {
    if (ENCRYPTED_PROPS.indexOf(key) !== 0) {
      return val;
    }
    return encrypt(val);
  }

  /**
   * @param {string} val
   * @param {string} key
   * @returns {*}
   */
  function mapDecrypt(val, key) {
    if (ENCRYPTED_PROPS.indexOf(key) !== 0) {
      return val;
    }
    return decrypt(val);
  }

  function setItem(id, val) {
    db[id] = R.mapObjIndexed(mapEncrypt, val);
    return Q.resolve(val);
  }

  function create(val) {
    const invalid = 'projects new at least an id, and repo';
    if (!val) {
      return Q.reject(new TypeError(invalid));
    }
    if (!val.id || !val.repo) {
      return Q.reject(new TypeError(invalid));
    }

    const newVal = {
      id: val.id,
      repo: val.repo,
      name: val.name || '',
      sharedKey: val.sharedKey || '',
      gitHubKey: val.gitHubKey || '',
      channel: val.channel || val.id
    };

    return getItem(val.id)
      .then(() => {
        throw new Error('Project exists');
      }, () => {
        return setItem(val.id, newVal);
      });
  }

  return {
    find,
    create,
    getItem,
    setItem,
    init
  };
}


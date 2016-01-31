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


function getProjectsDB(config, pm) {
  const encrypt = R.partial(crypto.encrypt, config.dbKey);
  const decrypt = R.partial(crypto.decrypt, config.dbKey);

  const db = Object.create(null),
    init = populateFromAWS()
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
    console.log('here', id, val);
    db[id] = R.mapObjIndexed(mapEncrypt, val);
    console.log('not here');
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

  function list() {
    return Q.resolve(Object.keys(db));
  }

  return {
    find,
    create,
    getItem,
    setItem,
    list,
    init
  };
}

module.exports = getProjectsDB;

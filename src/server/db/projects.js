'use strict';

const Q = require('q'),
  util = require('../../util');

function getProjectsDB(config, pm) {

  var db = Object.create(null),
    init = populateFromAWS().fail((err) => {
      util.error('Projects: Failed to populate existing resources', err);
    });

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
      return Q.resolve(db[id]);
    }
    return Q.reject(new Error(`${id} not found`));
  }

  function setItem(id, val) {
    db[id] = val;
    return Q.resolve(val);
  }

  function create(val) {
    const invalid = 'projects new at least an id, and repo';
    if (!val) {
      return Q.reject(new TypeError(invalid));
    }
    if (!val.id || !val.repo) {
      return Q.reject(new TypeError(invalid))
    }


    var newVal = {
      id: val.id,
      repo: val.repo,
      name: val.name || '',
      sharedKey: val.sharedKey || '',
      repoToken: val.repoToken || '',
      channel: val.channel || val.id
    };

    return getItem(val.id)
      .then(() => {
        throw new Error('Project exists');
      }, () => {
        return setItem(val.id, newVal);
      })
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

'use strict';

/**
 * Watches for project tags on cloud services and adds project databases to
 * keep them tracked
 * @module server/daemons/project-daemon
 */

const Q = require('q');
const util = require('../../util');
const POLL_INTERVAL = 30000;

let intervalId = null;

module.exports = watchForExisting;

/**
 * Watches for existing databases returns
 * Returns a function that will cancel the watch
 * @param {ProjetManager} pm
 * @param {function(string, *=)} db
 * @param {{ token: string, protocol: string, prefix: string }} defaultRepo
 * @returns {Function}
 */
function watchForExisting(pm, db, defaultRepo) {
  if (intervalId) {
    return stop;
  }
  intervalId =
    setInterval(() => populateFromAWS(pm, db, defaultRepo), POLL_INTERVAL);

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return stop;
}

/**
 *
 * @param {ProjectManager} pm
 * @param {function(...)} db
 * @param {{ token: string, protocol: string, prefix: string }} defaultRepo
 * @returns {Promise.<T>}
 */
function populateFromAWS(pm, db, defaultRepo) {
  return pm
    .listProjects()
    .then((list) => {
      return Q.all([list.map((name) => {
        return db(name)()
          .then((r) => {
            if (!r) { throw new Error('no database entry'); }
          })
          .fail(() => {
            return db({
              id: name,
              repo: getDefaultRepo(defaultRepo, name)
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

/**
 * @param {string} prefix
 * @returns {string}
 */
function checkPrefix(prefix) {
  if (!prefix || prefix.length < 1) {
    return 'github.com/set-config-default-repo-prefix/';
  }
  return prefix[prefix.length - 1] === '/' ? prefix : prefix + '/';
}

/**
 * @param {{ token: string, protocol: string, prefix: string }} defaultRepo
 * @param {string} name
 * @returns {string}
 */
function getDefaultRepo(defaultRepo, name) {
  if (!defaultRepo) {
    throw new Error('Projects: Default repository not configured');
  }
  const secret = defaultRepo.token ?
  defaultRepo.token + '@' : '';

  return defaultRepo.protocol + secret +
    checkPrefix(defaultRepo.prefix) + name + '.git';
}


'use strict';

module.exports = {
  find
};

/**
 * Resolves a record if it exists, rejects otherwise
 * @param {function(string|*, *=)} db
 * @param {string} id
 * @return {Promise<*>}
 */
function find(db, id) {
  return db(id)()
    .then((r) => {
      if (!r) {
        throw new Error('found emptiness');
      }
      return r;
    });
}

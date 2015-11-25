'use strict';

/*global require, module*/

var authorities = Object.create(null),
  Q = require('q'),
  DEFAULT_AUTHORITY = 'regular',
// *NOTE* ORDER MATTERS
  authorityTypes = ['regular', 'manager', 'admin'];

module.exports = {
    find: find,
    create: createAuthority,
    change: changeAuthority,
    types: authorityTypes,
    ADM: 'admin',
    REG: 'regular',
    MGR: 'manager'
};

/**
 * @param {string} authority
 * @return {{ authority: string }}
 */
function validateAuthority(id, authority) {
    var offset = authorityTypes.indexOf(authority);
    // invalid case
    if (offset === -1) {
        return {
            id: id,
            authority: DEFAULT_AUTHORITY
        };
    }
    // valid case
    return {
        id: id,
        authority: authorityTypes[offset]
    };
}

/**
 * @param {string} id
 * @return {Q.Promise}
 */
function find(id) {
    var d = Q.defer();
    if (authorities[id]) {
        d.resolve(authorities[id]);
    } else {
        d.reject(new Error('not found'));
    }
    return d.promise;
}

/**
 * @param {string} id
 * @param {string} authority
 * @return {Q.Promise}
 */
function createAuthority(id, authority) {
    return find(id).then(() => {
        // invalid case
        throw new Error('password exists');
    }, () => {
        // expected case
        authorities[id] = validateAuthority(id, authority);
        return authorities[id];
    });
}

function changeAuthority_(id, authority) {
    var d = Q.defer();
    authorities[id] = validateAuthority(id, authority)
    d.resolve();
    return d.promise;
}

/**
 * @param {string} id
 * @param {string} authority
 * @return {Q.Promise}
 */
function changeAuthority(id, authority) {
    // change passwords
    return find(id).then(() => {
        return changeAuthority_(id, authority);
    });
}

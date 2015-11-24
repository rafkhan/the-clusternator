'use strict';

/**
 *  More or less a promise wrapper around credential
 */
/*global require, module */


var pw = require('credential'),
    Q = require('q');

module.exports = {
    saltHash: saltHash,
    saltHashUser: saltHashUser,
    verify: verify
};

/**
 * @param {string} password
 * @returns {Q.Promise}
 */
function saltHash(password) {
    var d = Q.defer();
    pw.hash(password, (err, saltHash) => {
        if (err) {
            d.reject(err);
            return;
        }
        d.resolve(saltHash);
    });
    return d.promise;
}


/**
 * @param {{ password: string }} user
 * @returns {Q.Promise}
 */
function saltHashUser(user) {
    return saltHash(user.password).then((saltedHash) => {
        user.password = saltedHash;
        return user;
    });
}

/**
 * @param {string} storedSaltedHash
 * @param {string} input
 */
function verify(storedSaltedHash, input) {
    var d = Q.defer();
    pw.verify(storedSaltedHash, input, (err, isValid) => {
        if (err) {
            d.reject(err);
            return;
        }
        if (isValid) {
            d.resolve(true);
            return;
        }
        d.reject(new Error('Password Mismatch'));
    });
    return d.promise;
}


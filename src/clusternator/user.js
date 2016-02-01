'use strict';
/**
 * Interface between the CLI, and remote REST API
 *
 * @module clusternator/user
 */

const makePostRequest = require('./common').makePostRequest;
const Q = require('q');

module.exports = {
  create,
  changePassword,
  login
};

function passwordMismatch() {
  return Q.reject(new Error('password mismatch'));
}

/**
 * @param {string} username
 * @param {string} password
 * @param {string} confirm
 * @param {number=} authority
 * @returns {Q.Promise}
 */
function create(username, password, confirm, authority) {
  if (password !== confirm) {
    return passwordMismatch();
  }
  return makePostRequest('/user/create', {
    username,
    password,
    authority: parseInt(authority, 10)
  });
}

/**
 * @param {string} username
 * @param {string} password
 * @param {string} newPassword
 * @param {string} confirm
 * @returns {Q.Promise}
 */
function changePassword(username, password, newPassword, confirm) {
  if (newPassword !== confirm) {
    return passwordMismatch();
  }
  return makePostRequest('/user/passwd', {
    username,
    password,
    passwordNew: newPassword
  }, false);

}

/**
 * @param {string} username
 * @param {string} password
 */
function login(username, password) {
  return makePostRequest('/login', {
    username,
    password
  }, false);
}
'use strict';

const makePostRequest = require('./common').makePostRequest;
const Q = require('q');

module.exports = {
  create
};

function create(username, password, confirm, authority) {
  if (password !== confirm) {
    return Q.reject(new Error('password mismatch'));
  }
  return makePostRequest('/user/create', {
    username: username,
    password: password,
    authority: parseInt(authority, 10)
  });
}
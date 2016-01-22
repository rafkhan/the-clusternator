'use strict';

const DEFAULT_AUTHORITY = 2;

const Q = require('q');
const cmn = require('../common');
const Config = cmn.src('config');
const util = cmn.src('util');
const cn = require('../js/js-api');

module.exports = {
  createUser,
  login,
  changePassword
};

const truthy = (i) => i ? true : false;

const isMinLingeth = (config, value) => {
  const min = config.minPasswordLength || 13;
  return (value + '').length >= min;
};

const makePasswordQ = (config, isNew) =>  {
  let message;
  if (isNew) {
    message = 'New Password';
  } else {
    message = 'Password';
  }
  return [{
    type: 'password',
    name : 'password',
    message : message,
    validate : (answer) => config ?
      isMinLingeth(config, answer) : truthy(answer)
  }];
};

const makeConfirmQ = () => {
  return [{
      type: 'password',
      name: 'confirm',
      message : 'Please Confirm Your Password',
      validate: truthy
    }];
};

const makeUsernameQ = (username) => {
  return [{
    type: 'input',
    name: 'username',
    message : 'Clusternator username',
    default: username,
    validate: truthy
  }];
};

const makeAuthorityQ = () => {
  return  [{
    type: 'input',
    name: 'authority',
    message : 'Authority (lower number === more authority)',
    default: DEFAULT_AUTHORITY,
    validate: (val) => parseInt(val, 10) >= 0 ?
      parseInt(val, 10) : DEFAULT_AUTHORITY
  }];
};

const confirmQ = (config) => {
  return util
    .inquirerPrompt(makePasswordQ(config, true).concat(makeConfirmQ()))
    .then((answers) => answers.password !== answers.confirm ?
      confirmQ(config) : answers);
};

const usernameQ = (username) => {
  return util
    .inquirerPrompt(makeUsernameQ(username).concat(makePasswordQ()));
};

const usernamePasswordQ = (username) => {
  return util
    .inquirerPrompt(makeUsernameQ(username).concat(makePasswordQ()));
};

const usernameAuthorityQ = (username) => {
  return util
    .inquirerPrompt(usernameQ(username).concat(makeAuthorityQ()));
};


/**
 * @param {Object} config
 * @param {string=} username
 * @returns {string}
 */
function getUserName(c, username) {
  if (!username) {
    if (c.user && c.user.credentials) {
      username = c.user.credentials.user;
    }
  }
  if (!username) {
    return '';
  }
  return username;
}

function passwordMismatch() {
  return Q.reject(new Error('password mismatch'));
}


/**
 * @param {string=} username
 * @param {string=} password
 * @param {string=} confirm
 * @param {number=} authority
 * @returns {Q.Promise}
 */
function createUser(username, password, confirm, authority) {
  const c = Config();
  username = getUserName(c, username);
  if (password !== confirm) { return passwordMismatch(); }
  if (username) {
    return cn.createUser(username, password, confirm, parseInt(authority, 10));
  }

  return usernameQ(username)
    .then((usernameAnswer) => confirmQ(c)
      .then((pwConfirm) => cn
        .createUser(usernameAnswer.username,
          pwConfirm.password, pwConfirm.confirm, authority)));
}


/**
 * @param {string=} username
 * @param {string=} password
 */
function login(username, password) {
  const c = Config();
  username = getUserName(c, username);
  if (password && username) {
    return cn.login(username, password);
  }
  return usernamePasswordQ(username)
    .then((answers) => cn.login(answers.username, answers.password));
}

/**
 * @param {string=} username
 * @param {string=} password
 * @param {string=} newPassword
 * @param {string=} confirm
 * @returns {Q.Promise}
 */
function changePassword(username, password, newPassword, confirm) {
  const c = Config();
  username = getUserName(c, username);
  if (newPassword !== confirm) { return passwordMismatch(); }
  return usernamePasswordQ(username)
    .then((userAnswer) => confirmQ(c)
      .then((confirmAnswers) => cn
        .changePassword(userAnswer.username, password, confirmAnswers.password,
          confirmAnswers.confirm)));
}

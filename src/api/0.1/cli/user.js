'use strict';
/**
 * This module is a middleware that sits between {@link module:api/'0.1'/cli}
 and {@link module:api/'0.1'/clusternator}

 This module manages/organizes user input for user management, and passes it to
 {@link module:api/'0.1'/clusternator}
 * @module api/'0.1'/cli/cloudService
 */

const Q = require('q');
const cmn = require('../common');
const Config = cmn.src('config');
const util = cmn.src('util');
const cn = require('../js/js-api');

module.exports = {
  createUser,
  login,
  changePassword,
  checkConfigured,
  checkConfiguredAndLoggedIn
};

const truthy = (i) => i ? true : false;

const isMinLingeth = (config, value) => {
  const min = config.minPasswordLength || 13;
  return (value + '').length >= min;
};

const makeSaveTokenQ = (defaultVal) =>  {
  defaultVal = defaultVal ? true : false;
  return [{
    type: 'confirm',
    name : 'saveToken',
    message : 'Do you want to save this token for future use?',
    default: defaultVal
  }];
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
    type: 'list',
    name: 'authority',
    message: 'Authority',
    choices: ['Admin', 'Project Lead', 'User'],
    default: 'User',
    filter: (val) => {
      if (val === 'Admin') {
        return 0;
      } else if (val === 'Project Lead') {
        return 1;
      } else {
        return 2;
      }
    }
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
    .inquirerPrompt(makeUsernameQ(username));
};

const usernamePasswordQ = (username) => {
  return util
    .inquirerPrompt(makeUsernameQ(username).concat(makePasswordQ()));
};

const usernameAuthorityQ = (username) => {
  return util
    .inquirerPrompt(makeUsernameQ(username).concat(makeAuthorityQ()));
};

/**
 * resolves if a user has a config file
 * @returns {Q.Promise<Object>}
 */
function checkConfigured() {
  const user = Config().user;
  if (user && user.credentials) {
    return Q.resolve(user);
  }
  console.log('');
  console.log('Clusternator could not find a user configuration.');
  console.log('Please enter configuration details:');
  console.log('');
  return Config
    .interactiveUser()
    .then((user) => {
      console.log('User configuration complete');
      console.log('');
      return user;
    });

}

/**
 * resolves if a user has a config file, and seems to be logged in
 * @returns {Q.Promise<Object>}
 */
function checkConfiguredAndLoggedIn() {
  return checkConfigured()
    .then((user) => {
      if (userHasToken(user)) {
        return Q.resolve();
      }
      console.log('');
      console.log('Please Login To Proceed: ');
      console.log('');
      return login(user.credentials.user);
    });
}

/**
 * @param {{ user: { credentials: string} }} c
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
 * @param {Object} config
 * @returns {Q.Promise}
 */
function promptCreateUser(config) {
  return usernameAuthorityQ('new user')
    .then((usernameAuthAnswer) => confirmQ(config)
      .then((pwConfirm) => cn
        .createUser(usernameAuthAnswer.username,
          pwConfirm.password, pwConfirm.confirm,
          usernameAuthAnswer.authority)));
}

/**
 * @param {{ credentials: { token: string } }} user
 * @returns {boolean}
 */
function userHasToken(user) {
  return user && user.credentials && user.credentials.token;
}

/**
 * @param {string=} username
 * @param {string=} password
 * @param {string=} confirm
 * @param {number=} authority
 * @returns {Q.Promise}
 */
function createUser(username, password, confirm, authority) {
  if (password !== confirm) { return passwordMismatch(); }
  const c = Config();

  return checkConfiguredAndLoggedIn()
  .then(() => {
    username = getUserName(c, username);

    // actually start creating user
    if (username && password) {
      return cn
        .createUser(username, password, confirm, parseInt(authority, 10));
    }

    return promptCreateUser(c);

  });



}

/**
 * @param {{ token: string }} loginDetails
 * @return {Q.promise}
 */
function saveLoginDetails(loginDetails) {
  return Config.saveToken(loginDetails.token);
}

/**
 * @param {Object} loginDetails
 * @return {Q.Promise}
 */
function afterLogin(loginDetails) {
  console.log('Login Successful');
  return util.inquirerPrompt(makeSaveTokenQ(true))
    .then((answers) => {
      if (answers.saveToken) {
        return saveLoginDetails(loginDetails);
      }
    });
}

/**
 * @param {string=} username
 * @param {string=} password
 */
function login(username, password) {
  const c = Config();
  username = getUserName(c, username);
  if (password && username) {
    return checkConfigured()
      .then(() => cn.login(username, password));
  }
  return checkConfigured()
    .then(() => usernamePasswordQ(username)
      .then((answers) => cn
        .login(answers.username, answers.password)
        .then(afterLogin))
      .fail((err) => {
        if (err.message.indexOf('401') >= 0) {
          console.log('');
          console.log('Unauthorized, plese try again:');
          console.log('');
          return login(username);
        }
        throw err;
      }));
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
  if (username && password && newPassword) {
    return checkConfigured()
    .then(() => cn
      .changePassword(username, password, newPassword, confirm));
  }
  return checkConfigured()
    .then(() => usernamePasswordQ(username)
      .then((userAnswer) => confirmQ(c)
        .then((confirmAnswers) => cn
          .changePassword(userAnswer.username, userAnswer.password,
            confirmAnswers.password, confirmAnswers.confirm)))
      .then(() => console.log('Password changed')));
}

'use strict';

const inspect = require('util').inspect;
const path = require('path');
const Q = require('q');
const cn = require('../js/js-api');
const cmn = require('../common');

const constants = cmn.src('constants');
const util = cmn.src('util');
const dockernate = cmn.src('dockernate');

const users = cmn.src('server','auth','users');
const passwords = cmn.src('server','auth','passwords');
const tokens = cmn.src('server','auth','tokens');
const Projects = cmn.src('server','db','projects');

const gpg = cmn.src('cli-wrappers', 'gpg');
const slack = cmn.src('cli-wrappers','slack');

const API = constants.DEFAULT_API_VERSION;
const DEFAULT_AUTHORITY = 2;

const STATE = {
  config: null,
  pm: null,
  db: null
};

module.exports = getCommands;

const EXPORTS = {
  user: {
    create: (body) => createUser(body),
    passwd: (body) => changePass(body)
  },
  project: {
    'create-data': createData,
    'reset-auth-token': resetAuthToken,
    'reset-shared-key': resetSharedKey,
    'reset-git-hub-key': resetGitHubKey,
    'shared-key': sharedKey,
    'git-hub-key': gitHubKey,
    create: (body) => createProject(body),
    list: listProjects,
    'list-ssh-instances': listSSHAbleInstances,
    describe: noopP,
    destroy: pmDestroy,
    build: (body) => {
      console.log('BODY', body);
      console.log('figure this out');
      //projectBuild();
    }
  },
  pr: {
    create: prCreate,
    list: noopP,
    describe: noopP,
    destroy: prDestroy
  },
  deployment: {
    create: pmCreateDeployment,
    list: noopP,
    describe: noopP,
    destroy: pmDestroyDeployment
  }
};


function noopP() {
  return Q.resolve(true);
}

function getPFail(res) {
  return (err) => {
    res.status(500).json({ error: err.message });
  };
}

/**
 * @param {*} pr
 * @returns {string}
 */
function sanitizePr(pr) {
  pr = parseInt(pr, 10);
  pr = pr !== pr ? 0 : pr;
  return pr + '';
}

/**
 * @param {{ projectId: string }} body
 * @returns {Q.Promise<string[]>}
 */
function listSSHAbleInstances(body) {
  if (!body || !body.projectId) {
    return Q.reject(
      new Error('list-ssh-instances: requires projectId, given: ' +
        inspect(body)));
  }
  const projectId = body.projectId + '';
  return state()
    .then((s) => s
      .pm.listSSHAbleInstances(projectId));
}

function createIfNotFound(s, projectId, repoName) {
  return s
      .db.create({ id: projectId, repo: repoName })
      .then((details) => Q
        .all([
          newToken(details.id),
          newKey(details, 'gitHubKey'),
          newKey(details, 'sharedKey') ])
        .then((results) => {
          details.gitHubKey = results[1].gitHubKey;
          details.sharedKey = results[2].sharedKey;
          return s.db.setItem(projectId, details)
            .then(() => results);
        }));
}

function resetData(details, repoName) {
  details.repo = repoName || details.repo || details.id;
  return Q
    .all([
      newToken(details.id),
      newKey(details, 'gitHubKey'),
      newKey(details, 'sharedKey') ]);
}

function resetIfFound(s, row, projectId, repoName) {
  return resetData(row, repoName)
    .then((result) => {
      row.gitHubKey = result[1].gitHubKey;
      row.sharedKey = result[2].sharedKey;
      return s.db.setItem(projectId, row)
        .then(() => result);
    });
}

function findOrCreate(s, projectId, repoName) {
  return s
    .db.find(projectId)
    .then((row) => resetIfFound(s, row, projectId, repoName),
      createIfNotFound(s, projectId, repoName));
}

function createData(body) {
  if (!body || !body.projectId) {
    return Q.reject(new Error('Project requires a projectId'));
  }
  body.projectId += '';
  body.repoName = body.repoName + '' || body.projectId;

  return state()
    .then((s) => findOrCreate(s, body.projectId, body.repoName)
      .then((results) => {
        console.log('not here');
        return {
          authToken: results[0],
          gitHubKey: results[1].gitHubKey,
          sharedKey: results[2].sharedKey
        };
      }));
}

/**
 * @param {string} projectId
 * @returns {Q.Promise<string>}
 */
function newToken(projectId) {
  return tokens.clear(makeTokenName(projectId))
    .then(() => tokens.create(makeTokenName(projectId)));
}

/**
 * @param {{ projectId: string}} body
 * @returns {Q.Promise<{ data: string }>}
 */
function resetAuthToken(body) {
  if (!body || !body.projectId) {
    return Q.reject(new Error('Project requires a projectId'));
  }
  return newToken(body.projectId)
    .then((token) => {
      return { data: token };
    });
}

/**
 * @param {{ projectId: string}} body
 * @param {string} attr
 * @returns {Q.Promise<string>}
 */
function getKey(body, attr) {
  if (!body || !body.projectId) {
    return Q.reject(new Error('Project requires a projectId'));
  }
  return state()
    .then((s) => s
      .db.getItem(body.projectId)
      .then((details) => {
        return { data: details[attr] };
      }));
}

/**
 * @param {Object} dbRow
 * @param {attr} string
 * @returns {Object}
 */
function newKey(dbRow, attr) {
  return gpg
    .generatePass()
    .then((pass) => {
      dbRow[attr] = pass;
      return dbRow;
    });
}

/**
 * @param {{ projectId: string}} body
 * @param {string} attr
 * @returns {Q.Promise<string>}
 */
function resetKey(body, attr) {
  if (!body || !body.projectId) {
    return Q.reject(new Error('Project requires a projectId'));
  }
  return state()
    .then((s) => s
      .db.getItem(body.projectId)
      .then((details) => newKey(details, attr))
      .then((details) => s
        .db.setItem(body.projectId, details)
        .then(() => {
          return { data: details[attr] };
        })));
}

/**
 * @param {{ projectId: string }} body
 * @returns {Q.Promise<{ data: string }>}
 */
function resetSharedKey(body) {
  return resetKey(body, 'sharedKey');
}

/**
 * @param {{ projectId: string }} body
 * @returns {Q.Promise<{ data: string }>}
 */
function resetGitHubKey(body) {
  return resetKey(body, 'gitHubKey');
}

/**
 * @param {{ projectId: string }} body
 * @returns {Q.Promise<{ data: string }>}
 */
function sharedKey(body) {
  return getKey(body, 'sharedKey');
}

/**
 * @param {{ projectId: string }} body
 * @returns {Q.Promise<{ data: string }>}
 */
function gitHubKey(body) {
  return getKey(body, 'gitHubKey');
}

/**
 * @param {Object} body
 * @returns {Q.Promise}
 */
function pmCreateDeployment(body) {
  return Q.resolve();
  /** @todo sanitiize body, and run this function */
  //return state()
  //  .then((s) => s
  //    .pm.createDeployment());
}

function pmDestroyDeployment(body) {
  return Q.resolve();
  /** @todo sanitiize body, and run this function */
    //return state()
    //  .then((s) => s
    //    .pm.destroyDeployment());
}

function prCreate(body) {
  return state()
    .then((s) => {
      const pr = sanitizePr(body.pr);
      const build = sanitizePr(body.build);
      const appDef = JSON.parse(body.appDef);
      const projectId = body.repo;
      const sshData = body.sshKeys;
      const useInternalSSL = body.useInternalSSL || false;

      console.log('DEBUG');
      console.log(JSON.stringify(body,  null, 2));
      console.log('DEBUG');

      return s.db.find(projectId).then((project) => s
        .pm.pr.create(projectId, pr + '', appDef, sshData, useInternalSSL)
        .then((prResult) => {
          return slack.message(`Create: ${projectId}, PR ${pr} ` +
            `successful.  Application will be available at ` +
            `<https://${prResult.url}>`,
            project.channel);
        })
        .fail((err) => {
          slack.message(`Create: ${projectId}, PR ${pr} ` +
            `failed: ${err.message}`, project.channel);
          throw err;
        }));
    });
}

/**
 * @param {{ id: string, pr: string }} body
 * @returns {Q.Promise}
 */
function prDestroy(body) {
  return state()
    .then((s) => s
      .db.find(body.id)
      .then((project) => s
        .pm.destroyPR(project.id, sanitizePr(body.pr))));
}

function listProjects(req, res) {
  return state()
    .then((s) => s
      .db.list()
      .then((projectIds) => {
        if (req.get('ContentType') === 'application/json') {
          res.json(projectIds);
        } else {
          res.render('projects', { api: API, projects: projectIds });
        }
      }, getPFail(res)));
}

function validateBackend(db, be) {
  var index = db.BACKENDS.indexOf(be);
  if (index === -1) {
    return db.BACKENDS[0];
  }
  return db.BACKENDS[1];
}

function pmDestroy() {
  const args = Array.prototype.slice.call(arguments, 0);
  return state()
    .then((s) => s.pm.destroy.apply(null, args));

}

/**
 * @param {{ projectId: string }} body
 * @returns {body.projectId}
 */
function createProject(body) {
  if (!body.projectId) {
    return Q.reject(new Error('No projectId given in post request'));
  }
  util.info('Attempting to create project:', body.projectId);
  state()
    .then((s) => s
      .pm.create(body.projectId));
}

function changePass(body) {
  if (!body.username) {
    return Q.reject(new Error('Create user requires a username'));
  }
  if (!body.password) {
    return Q.reject(new Error('Create user requires a password'));
  }

  return passwords.change(body.username, body.password, body.passwordNew);
}

/**
 * @param {{ username: string, password: string, authority?: number }} body
 */
function createUser(body) {
  if (!body.username) {
    return Q.reject(new Error('Create user requires a username'));
  }
  if (!body.password) {
    return Q.reject(new Error('Create user requires a password'));
  }
  body.authority = +body.authority || DEFAULT_AUTHORITY;
  return users.create({
    id: body.username,
    password: body.password,
    authority: body.authority
  });
}

/**
 * @param {{ config: Object, db: Object, pm: Object }} state
 * @returns {Q.Promise<{ config: Object, db: Object, pm: Object }>}
 */
function initDbState(state) {
  state.db = Projects(state.config, state.pm);
  return state.db
    .init.then(() => state.pm);
}

/**
 * @param {{ config: Object, db: Object, pm: Object }} state
 * @returns {Q.Promise<{ config: Object, db: Object, pm: Object }>}
 */
function initPmState(state) {
  state.pm = cn.awsProjectManager(state.config);
  return Q.resolve(state);
}

/**
 * @param {Object} config
 * @returns {Q.Promise<{ config: Object, db: Object, pm: Object }>}
 */
function init(config) {
  const state = STATE;
  state.config = config;
  state.db = null;
  state.pm = null;
  return initPmState(state)
    .then((pm) => initDbState(state))
  .then(() => state);
}

/**
 * @param projectId
 * @returns {*}
 */
function makeTokenName(projectId) {
  projectId = projectId + '';
  return  constants.PROJECT_USER_TAG + projectId;
}

/**
 * @param {Object=} config
 * @returns {Q.Promise<{ config: Object, db: Object, pm: Object }>}
 */
function state(config) {
  if (STATE.config && STATE.db && STATE.pm) {
    return Q.resolve(STATE);
  }
  if (STATE.config) {
    return init(STATE.config);
  }
  if (config) {
    return init(config);
  }
  return Q.reject(new Error('unable to find/allocate state'));
}

/**
 * @param config
 * @returns {{user: {create: EXPORTS.user.create, passwd: EXPORTS.user.passwd},
 project: {create-data: createData, reset-auth-key: resetAuthKey,
 reset-shared-key: resetSharedKey, reset-git-hub-key: resetGitHubKey,
 shared-key: sharedKey, git-hub-key: gitHubKey, create: EXPORTS.project.create,
 list: listProjects, list-ssh-instances: listSSHAbleInstances, describe: noopP,
 destroy: pmDestroy, build: EXPORTS.project.build}, pr: {create: prCreate,
 list: noopP, describe: noopP, destroy: prDestroy},
 deployment: {create: pmCreateDeployment, list: noopP, describe: noopP
 , destroy: pmDestroyDeployment}}}
 */
function getCommands(config) {
  STATE.config = config;

  return EXPORTS;
}

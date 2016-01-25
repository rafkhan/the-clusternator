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
const Projects = cmn.src('server','db','projects');

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
    create: (body) => createProject(body),
    list: listProjects,
    'list-ssh-instances': listSSHAbleInstances,
    getProject: getProject,
    setProject: setProject,
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

function setProject(req, res) {
  return state()
    .then((s) => s.db
      .find(req.params.project)
      .then((p) => {
        p.name = req.body.name;
        p.sharedKey = req.body.sharedKey;
        p.repoToken = req.body.repoToken;
        p.channel = req.body.channel;
        p.backend = validateBackend(s.db, req.body.backend);
        return s
          .db.setItem(p.id, p)
          .then(() => {
            res.json(p);
          });
      }, () => {
        res.status(404).json({ error: 'Not Found'});
      }).fail(getPFail(res)));
}

function getProject(req, res) {
  return state()
    .then((s) => s
      .db.find(req.params.project)
      .then((project) => {
        if (req.get('ContentType') === 'application/json') {
          res.json({
            id: project.id,
            name: project.name,
            sharedKey: project.sharedKey,
            channel: project.channel
          });
        } else {
          res.render('project', {
            api: API, project: project, backends: s.db.BACKENDS
          });
        }
      }, () => {
        res.status(404).json({ error: 'Not Found'});
      }).fail(getPFail(res)));
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
 * @param {Object} config
 * @returns {{user: {create: EXPORTS.user.create, passwd: EXPORTS.user.passwd},
 project: {create: EXPORTS.project.create, list: listProjects,
 getProject: getProject, setProject: setProject, describe: noopP, destroy: *,
 build: EXPORTS.project.build}, pr: {create: EXPORTS.pr.create, list: noopP,
 describe: noopP, destroy}, deployment: {create: createDeployment, list: noopP,
 describe: noopP, destroy: destroyDeployment}}}
 */
function getCommands(config) {
  STATE.config = config;

  return EXPORTS;
}

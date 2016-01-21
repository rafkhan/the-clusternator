'use strict';

const aws = require('../../../aws/project-init');
const path = require('path');
const util = require('../../../util');
const dockernate = require('../../../dockernate');
const slack = require('../../../cli-wrappers/slack');
const config = require('../../../config')();
const constants = require('../../../constants');
const Projects = require('../../../server/db/projects');
const Q = require('q');

const API = constants.DEFAULT_API_VERSION;

var projects;

function noopP() {
  return Q.resolve(true);
}

function getPFail(res) {
  return (err) => {
    res.status(500).json({ error: err.message });
  };
}

function sanitizePr(pr) {
  pr = +pr;
  return pr !== pr ? 0 : pr;
}

/**
 * @param {{id: string, repo: string}} project
 * @param {string} pr
 * @param {string} sha
 * @param {function(...):Q.Promise} middleware
 * @returns {Q.Promise}
 */
function prCreateDocker(project, pr, sha, middleware) {
  const image = `${config.dockerRegistryPrefix}${project.id}:${pr}`;
  return dockernate.create(
    project.backend, project.repo, image, sha, middleware)
    .then(() => {
      return image;
    }, (err) => {
      throw err;
    }, (update) => {
      if (!update) {
        util.info('prCreateDocker: unexpected lack of data');
        return;
      }
      if (update.error) {
        console.log(update.error);
      }
    });
}

function makePrCreate(pm) {
  return (body) => {
    var pr = sanitizePr(body.pr),
      build = sanitizePr(body.build),
      appDef = JSON.parse(body.appDef),
      projectId = body.repo,
      sshData = body.sshKeys,
      useInternalSSL = body.useInternalSSL || false;

    console.log('DEBUG');
    console.log(JSON.stringify(body,  null, 2));
    console.log('DEBUG');

    return projects.find(projectId).then((project) => {
      return pm.pr.create(projectId, pr + '', appDef, sshData, useInternalSSL)
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
        });
    });
  };
}

/**
 * @param {ProjectManager} pm
 * @returns {Function(Object)}
 */
function makePrDestroy(pm) {
  return (body) => {
    var pr = sanitizePr(body.pr);
    return projects
      .find(body.id)
      .then((project) => {
        return pm.destroyPR(project.id, pr + '');
      });
  };
}

function listProjects(req, res, next) {
  projects.list().then((projectIds) => {
    if (req.get('ContentType') === 'application/json') {
      res.json(projects);
    } else {
      res.render('projects', { api: API, projects: projectIds });
    }
  }, getPFail(res));
}

function validateBackend(be) {
  var index = projects.BACKENDS.indexOf(be);
  if (index === -1) {
    return projects.BACKENDS[0];
  }
  return projects.BACKENDS[1];
}

function setProject(req, res, next) {
  projects.find(req.params.project).then((p) => {
    p.name = req.body.name;
    p.sharedKey = req.body.sharedKey;
    p.repoToken = req.body.repoToken;
    p.channel = req.body.channel;
    p.backend = validateBackend(req.body.backend);
    return projects
      .setItem(p.id, p)
      .then(() => {
        res.json(p);
      });
  }, () => {
    res.status(404).json({ error: 'Not Found'});
  }).fail(getPFail(res));
}

function getProject(req, res, next) {
  projects.find(req.params.project).then((project) => {
    if (req.get('ContentType') === 'application/json') {
      res.json({
        id: project.id,
        name: project.name,
        sharedKey: project.sharedKey,
        channel: project.channel
      });
    } else {
      res.render('project', {
        api: API, project: project, backends: projects.BACKENDS
      });
    }
  }, () => {
    res.status(404).json({ error: 'Not Found'});
  }).fail(getPFail(res));
}

function getCommands(credentials) {

  return aws(credentials)
    .then((pm) => {
      projects = Projects(config, pm);
      return projects
        .init
        .then(() => pm);
    })
    .then((pm) => {
      return {
        projects: {
          create: pm.create,
          list: listProjects,
          getProject: getProject,
          setProject: setProject,
          describe: noopP,
          destroy: pm.destroy,
          build: (body) => {
            console.log('BODY', body);
            console.log('figure this out');
            //projectBuild();
          }
        },
        pr: {
          create: (body) => {
            makePrCreate(pm)(body);
            return Q.resolve();
          },
          list: noopP,
          describe: noopP,
          destroy: makePrDestroy(pm)
        },
        deployment: {
          create: pm.createDeployment,
          list: noopP,
          describe: noopP,
          destroy: pm.destroyDeployment
        }
      };
    });
}

module.exports = getCommands;

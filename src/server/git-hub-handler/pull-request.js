'use strict';
/**
 * Handler for GitHub pull request events
 *
 * @module server/gitHubPullRequest
 */

const R = require('ramda');

let serverUtil = require('../util');
const util = require('../../util');
const log = require('../loggers').logger;

function destroyPr(pm, projectId, prNum) {
  return pm.destroyPR(projectId, prNum)
    .then(() => log.info(`PR #${prNum} Destroyed for ${projectId}`))
    .fail((err) => log.error(`PR #${prNum} Destruction failed on` +
      `${projectId}: ${err.message}`));
}

function pullRequestRouteHandler(pm, req, res) {
  const error = R.curry(serverUtil.sendError)(res);

  util.info('PR Action: ', req.body.action);
  const ghAction = req.body.action;
  const projectId = res.locals.projectName;
  const prNum = req.body.pull_request.number + '';

  if(ghAction === 'closed') {
    log.info(`Closing Pull Request ${projectId}`);
    destroyPr(pm, projectId, prNum);
    res.sendStatus(200);
  } else {
    error(405, `${ghAction} is not supported`);
  }
}

module.exports = pullRequestRouteHandler;

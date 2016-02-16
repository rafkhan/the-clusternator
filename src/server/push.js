'use strict';
/**
 * Handler for GitHub push events
 *
 * @module server/gitHubPush
 */

const R = require('ramda');

const serverUtil = require('./util');
const resourceId = require('../resource-identifier');
const log = require('./loggers').logger;
const util = require('../util');

const missingPropertyStatus = 400;

function pushHandler(pm, req, res) {
  const error = R.curry(serverUtil.sendError)(res);

  const body = req.body;

  // essential
  const appdef = body.appdef;
  const tag = body.tag;


  if(!tag) {
    error(missingPropertyStatus,
          '"tag" required for project identification.');
    return;
  }

  if(!appdef) {
    error(missingPropertyStatus,
          '"appdef" required to instantiate cluster.');
    return;
  }

  // TODO swap out image tag name in appdef object? Either here or in client.

  const parsedAppdef = JSON.parse(appdef);
  const parsedTag = resourceId.parseRID(tag);

  if(!parsedTag) {
    error(missingPropertyStatus,
          'Can not parse tag.');
    return;
  }

  log.info('Tag segments:', parsedTag);

  if(!parsedTag.pid) {
    error(missingPropertyStatus,
          'Missing "pid" property in tag.');
    return;
  }

  if(!parsedTag.pr) {
    error(missingPropertyStatus,
          'Missing "pr" property in tag.');
    return;
  }

  log.info('Building project %s:%s',
            parsedTag.pid, parsedTag.pr);

  // XXX SWAP FOR WINSTON
  log.info('Generating application with tags:', parsedTag);

  pm.createPR(parsedTag.pid, parsedTag.pr, parsedAppdef)
    .then((res) => { log.info('Successfully build %s:%s',
                              parsedTag.pid, parsedTag.pr); },
          (err) => {
            log.error('failed to build %s:%s',
                       parsedTag.pid, parsedTag.pr);
            log.error(err.stack);
          });

  const resp = JSON.stringify({
    appdef: appdef,
    tag: tag
  }, null, 2);

  res.send(resp);
}

module.exports = pushHandler;

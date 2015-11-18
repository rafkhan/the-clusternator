'use strict';

var R = require('ramda');

var serverUtil = require('./util');
var resourceId = require('../resourceIdentifier');
var log = require('./loggers').logger;

var missingPropertyStatus = 400;

function pushHandler(prManager, req, res) {
  var error = R.curry(serverUtil.sendError)(res);

  var body = req.body;

  // essential
  var appdef = body.appdef;
  var tag = body.tag;

  if(!tag) {
    error(missingPropertyStatus,
          '"tag" required for project identification.');
  }

  if(!appdef) {
    error(missingPropertyStatus,
          '"appdef" required to instantiate cluster.');
  }

  // TODO swap out image tag name in appdef object? Either here or in client.

  var parsedAppdef = JSON.parse(appdef);
  var parsedTag = resourceId.parseRID(tag);
  var prStr = parsedTag.pr + '';

  console.log(tag, parsedTag);

  log.info('Building project %s:%s',
            parsedTag.pid, parsedTag.pr);

  // XXX SWAP FOR WINSTON
  console.log('Generating application with tags:', parsedTag);

  prManager.create(parsedTag.pid, parsedTag.pr, parsedAppdef)
    .then((res) => { log.info('Successfully build %s:%s',
                              parsedTag.pid, parsedTag.pr); },
          (err) => {
            log.error('failed to build %s:%s',
                       parsedTag.pid, parsedTag.pr);
          });

  var resp = JSON.stringify({
    appdef: appdef,
    tag: tag
  }, null, 2);

  res.send(resp);
}

module.exports = pushHandler;

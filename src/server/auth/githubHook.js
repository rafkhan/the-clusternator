'use strict';
/**
 * Not sure if this is still active?
 *
 * @deprecated
 * @module server/gitHubHook
 */

var crypto = require('crypto');

var q = require('q');
var typer = require('media-typer');
var loggers = require('../loggers');
var log = loggers.logger;

function checkHmac(key, text, digest) {
  var hmac = crypto.createHmac('sha1', key);
  hmac.setEncoding('hex');
  hmac.write(text);
  hmac.end();
  var hash = 'sha1=' + hmac.read();

  if(hash === digest) {
    log.info('Github signature match.');
    return true;
  } else {
    var msg = 'Invalid signature. ' +
              'Got: ' + hash + ' ' +
              'Expected: ' + digest;

    log.error(msg);
    return false;
  }
}


function middlewareFactory(ddbManager) {
  function middleWare(req, res, next) {
    var signature = req.get('X-Hub-Signature');
    if(!signature) {
      log.debug('Rejecting github request with no signature.');
      res.status(401);
      res.send('No signature');
      return;
    }


    var text = req.rawBody;
    var prBody = req.rawBody.pull_request;
    var projectName = prBody.head.repo.name;

    ddbManager.getItems(ddbManager.tableNames.GITHUB_AUTH_TOKEN_TABLE,
        { ProjectName:
          { ComparisonOperator: 'EQ',
            AttributeValueList: [{ S: projectName }]}})
      .then((result) => {
        if(result.Count > 0) {
          var key = result.Items[0].GithubSecretToken.S;
          if(checkHmac(key, text, signature)) {
            next(req, res);
          } else {
            res.status(401);
            res.send('Invalid signature');
          }
        }
      }, q.reject);
  }

  return middleWare;
}

module.exports = middlewareFactory;

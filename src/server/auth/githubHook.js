'use strict';
/**
 * Not sure if this is still active?
 *
 * @deprecated
 * @module server/gitHubHook
 */

const crypto = require('crypto');

const q = require('q');
const typer = require('media-typer');
const loggers = require('../loggers');
const log = loggers.logger;

function checkHmac(key, text, digest) {
  const hmac = crypto.createHmac('sha1', key);
  hmac.setEncoding('hex');
  hmac.write(text);
  hmac.end();
  const hash = 'sha1=' + hmac.read();

  if(hash === digest) {
    log.info('Github signature match.');
    return true;
  } else {
    const msg = 'Invalid signature. ' +
              'Got: ' + hash + ' ' +
              'Expected: ' + digest;

    log.error(msg);
    return false;
  }
}


function middlewareFactory(pm) {
  function middleWare(req, res, next) {
    const signature = req.get('X-Hub-Signature');
    if(!signature) {
      log.debug('Rejecting github request with no signature.');
      res.status(401);
      res.send('No signature');
      return;
    }


    const text = req.rawBody;
    const prBody = req.rawBody.pull_request;
    const projectName = prBody.head.repo.name;

    /** @todo replace this with hash table implementation */
    return q.resolve();
    //ddbManager.getItems(ddbManager.tableNames.GITHUB_AUTH_TOKEN_TABLE,
    //    { ProjectName:
    //      { ComparisonOperator: 'EQ',
    //        AttributeValueList: [{ S: projectName }]}})
    //  .then((result) => {
    //    if(result.Count > 0) {
    //      const key = result.Items[0].GithubSecretToken.S;
    //      if(checkHmac(key, text, signature)) {
    //        next(req, res);
    //      } else {
    //        res.status(401);
    //        res.send('Invalid signature');
    //      }
    //    }
    //  }, q.reject);
  }

  return middleWare;
}

module.exports = middlewareFactory;

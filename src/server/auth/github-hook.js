'use strict';
/**
 * Not sure if this is still active?
 *
 * @module server/gitHubHook
 */

const crypto = require('crypto');

const loggers = require('../loggers');
const log = loggers.logger;

/**
 * @param {string} key
 * @param {string} text
 * @param {string} digest
 * @returns {boolean}
 */
function checkHmac(key, text, digest) {
  const hmac = crypto.createHmac('sha1', key);
  hmac.setEncoding('hex');
  hmac.write(text);
  hmac.end();
  const hash = 'sha1=' + hmac.read();

  if(hash === digest) {
    log.info('GitHub signature match.');
    return true;
  } else {
    log.error(`Invalid signature. Got: ${hash} Expected: ${digest}`);
    return false;
  }
}


/**
 * @param {function(string|*, *=)} projectDb
 * @returns {middleWare}
 */
function middlewareFactory(projectDb) {
  function middleWare(req, res, next) {
    const signature = req.get('X-Hub-Signature');
    if(!signature) {
      log.debug('Rejecting github request with no signature.');
      res.status(401).json({ error: 'no signature' });
      return;
    }

    const text = req.rawBody;
    const prBody = req.body.pull_request;
    const projectName = prBody.head.repo.name;

    return projectDb(projectName)()
      .then((data) => checkHmac(data.gitHubKey, text, signature) ?
        next(req, res) : res.status(401).json({ error: 'no signature' }))
      .fail((err) => res.status(500)
        .json({ error: 'database error finding project signature' }));
  }

  return middleWare;
}

middlewareFactory.checkHmac = checkHmac;
module.exports = middlewareFactory;

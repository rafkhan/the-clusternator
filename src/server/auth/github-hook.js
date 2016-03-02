'use strict';
/**
 * Not sure if this is still active?
 *
 * @module server/gitHubHook
 */

const crypto = require('crypto');

const util = require('../../util');
const log = require('../loggers').logger;

/**
 * @param {string} key
 * @param {string} text
 * @returns {string}
 */
function createHmac(key, text) {
  const hmac = crypto.createHmac('sha1', key);
  hmac.setEncoding('hex');
  hmac.write(text);
  hmac.end();
  return 'sha1=' + hmac.read();
}

/**
 * @param {string} key
 * @param {string} text
 * @param {string} digest
 * @returns {boolean}
 */
function checkHmac(key, text, digest) {
  log.info('WE GET HERE WE GET HERE');
  const hash = createHmac(key, text);

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
middlewareFactory.createHmac = createHmac;
module.exports = middlewareFactory;

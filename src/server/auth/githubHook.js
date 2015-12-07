'use strict';

var crypto = require('crypto');

var getRawBody = require('raw-body')
var typer = require('media-typer')
var loggers = require('../loggers');
var log = loggers.logger;
 

function middleWare(req, res, next) {
  var signature = req.get('X-Hub-Signature');
  if(!signature) {
    log.debug('Rejecting github request with no signature.');
    res.status(401);
    res.send('No signature');
    return;
  }

  var text = req.rawBody;
  var key = 'KEY_HERE';

  var hmac = crypto.createHmac('sha1', key);
  hmac.setEncoding('hex');
  hmac.write(text);
  hmac.end();
  var hash = 'sha1=' + hmac.read();

  if(hash === signature) {
    next(req, res);
  } else {
    var msg = 'Invalid signature. ' + 
              'Got: ' + hash + ' ' +
              'Expected: ' + signature;

    log.error(msg);
    res.status(401);
    res.send('Invalid signature');
  }
}


module.exports = middleWare;

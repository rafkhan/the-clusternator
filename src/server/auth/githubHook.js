'use strict';

var crypto = require('crypto');

var getRawBody = require('raw-body')
var typer = require('media-typer')
 
function middleWare(req, res, next) {
  var signature = req.get('X-Hub-Signature');
  if(!signature) {
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
    next();
  } else {
    res.status(401);
    res.send('Invalid signature');
  }
}

module.exports = middleWare;

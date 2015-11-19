'use strict';

var fs = require('fs');
var q = require('q');
var request = require('superagent');
var resourceId = require('../resourceIdentifier');

var clusternateEndpoint = '/clusternate';

var isCircleCI = process.env.CIRCLECI === 'true';

function push(host, appdef, tag) {
  if(!isCircleCI) {
    return q.reject('Not running on circle CI.');
  }

  if(!host || !appdef || !tag) {
    return q.reject('Missing arguments');
  }


  // Strip ending / from host string
  var strippedHost = host.replace(/\/$/,'');
  var apiEndpoint = strippedHost + clusternateEndpoint;

  var d = q.defer();

  var readFile = q.nfbind(fs.readFile);
  readFile(appdef, 'utf8')
    .then((appdefText) => {
      return {
        appdef: appdefText,
        tag: tag
      };
    }, (err) => {
      var msg = 'Can not read appdef from ' + appdef;
      return msg;
    })

    .then((reqBody) => {

      console.log('Sending:', reqBody);

      request
        .post(apiEndpoint)
        .send(reqBody)
        .end((err, res) => { // TODO q short syntax
          if(err) {
            // Clean up error response
            d.reject(err);
          } else {
            var parsedRes = JSON.parse(res.text);
            var data = {};
            data.tag = parsedRes.tag;
            data.appdef = JSON.parse(parsedRes.appdef);
            d.resolve(data);
          }
        });
    }, (err) => {
      d.reject(err);
    });


  return d.promise;
}

function generateTagFromEnv() {
  var env = process.env;
  var tagOpts = {};

  if(env.CIRCLE_PR_NUMBER) {
    tagOpts.pr = env.CIRCLE_PR_NUMBER;
  }

  if(env.CIRCLE_PROJECT_REPONAME) {
    tagOpts.pid = env.CIRCLE_PROJECT_REPONAME;
  }

  var time = Date.now();
  tagOpts.time = time;

  var rid = resourceId.generateRID(tagOpts);

  return {
    tag: rid,
    opts: tagOpts
  };
}


module.exports = {
  push: push,
  generateTagFromEnv: generateTagFromEnv
};

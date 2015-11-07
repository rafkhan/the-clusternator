'use strict';

var q = require('q');
var request = require('superagent');
var resourceId = require('../resourceIdentifier');

var clusternateEndpoint = '/clusternate';

var isCircleCI = process.env.CIRCLECI === 'true';

function push(host, appdef, tag) {
  if(!isCircleCI) {
    return q.reject('Not running on circle CI.');
  }

  if(!host || !appdef || tag) {
    return q.reject();
  }

  var reqBody = {
    appdef: appdef,
    tag: tag
  };

  // Strip ending / from host string
  var strippedHost = host.replace(/\/$/,'');
  var apiEndpoint = strippedHost + clusternatorEndpoint;

  var d = q.defer();


  request
    .post(apiEndpoint)
    .send(reqBody)
    .end((err, res) => { // TODO q short syntax
      if(err) {
        d.reject(err);
      } else {
        d.resolve(res);
      }
    });

  return d.promise;
}

function generateTagFromEnv() {
  var env = process.env; 
  var tagOpts = {};

  if(env.CIRCLECI_PULL_REQUEST) {
    tagOpts.pr = env.CIRCLECI_PULL_REQUEST;
  }

  if(env.CIRCLECI_PROJECT_REPONAME) {
    tagOpts.pid = env.CIRCLECI_PROJECT_REPONAME;
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

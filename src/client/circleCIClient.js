'use strict';

var q = require('q');
var resourceId = require('../resourceIdentifier');

var isCircleCI = process.env.CIRCLECI === 'true';


function push(host, appdef, tag) {
  if(!isCircleCI) {
    return q.reject('Not running on circle CI.');
  }

  if(!host || !appdef || tag) {
    return q.reject();
  }

  // TODO complete this
  return q.resolve();
}

function generateTagFromEnv() {
  var env = process.env; 
  var tagOpts = {};

  if(env.CIRCLECI_PULL_REQUEST) {
    tagOpts.pr = env.CI_PULL_REQUEST;
  }

  if(env.CIRCLECI_PROJECT_REPONAME) {
    tagOpts.pid = env.CIRCLE_PROJECT_REPONAME;
  }

  var time = Date.now();
  tagOpts.time = time;

  console.log(tagOpts);

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

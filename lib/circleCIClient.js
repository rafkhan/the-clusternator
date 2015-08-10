'use strict';

var q = require('q');
var R = require('ramda');
var cp = require('child_process');


var TAG_DELIM = '.';

/**
 * This is the tag we give to an image that will
 * allow us to uniquely identify the whole thing
 *
 * TAG FORMAT
 * [first 10 chars of sha]:[branch]:[prUser]:[prNumber]
 *
 * TAG EXAMPLE
 * 5f55ac6c37:branch-name:rafkhan:51
 *
 */
function generateTagFromEnv(u) {
  u = u || {};
  var e = process.env;

  console.log(u);

  var sha = u.sha || e.CIRCLE_SHA1;
  var shaHead = R.take(10, sha);
  var branch = u.branch || e.CIRCLE_BRANCH;

  // TODO not require this
  var prNumber = u.prNumber || e.CIRCLE_PR_NUMBER;
  var prUser = u.prUser || e.CIRCLE_PR_USERNAME;

  var tag = [shaHead, branch, prUser, prNumber].join(TAG_DELIM);

  return tag;
}

function buildDockerImage(config) {
  config = config || {};

  var uniqueTag = config.tag;
  var repo = config.dockerRepo;

  if(!uniqueTag || !repo) {
    return q.reject('Requires repository and unique tag');
  }

  var dockerEmail = config.dockerEmail;
  var dockerUser  = config.dockerUser;
  var dockerPass  = config.dockerPass;
  var dockerFile  = config.dockerFile;

  var imgName = repo + ':' + uniqueTag;

  var cmd = 'docker login -e ' + dockerEmail +
                        ' -u ' + dockerUser +
                        ' -p ' + dockerPass + ' && ' +
            'docker build  -t ' + imgName + ' ' + dockerFile + ' && ' +
            'docker push ' + imgName;

  var d = q.defer();

  cp.exec(cmd, function(err, stdout, stderr) {
    if(err) {
      d.reject({
        err: err,
        stderr: stderr
      });
    } else {
      d.resolve(stdout);
    }
  });


  return d.promise;
}

function clusternate(config) {
  config = config || {};
  var e = process.env;

  var dockerEmail = config.dockerEmail || e.CLUSTERNATOR_DOCKER_EMAIL;
  var dockerUser  = config.dockerUser  || e.CLUSTERNATOR_DOCKER_USER;
  var dockerPass  = config.dockerPass  || e.CLUSTERNATOR_DOCKER_PASSWORD;
  var dockerRepo  = config.dockerRepo;

  var dockerFile = config.dockerFile;
  if(!dockerFile) {
    throw 'No dockerfile directory specified';
  }

  if(!dockerEmail || !dockerUser || !dockerPass ) {
    throw 'Missing docker credentials';
  }

  if(!dockerRepo) {
    throw 'Missing docker repo';
  }

  // XXX
  // simulated env
  var tagEnvOverride = {
    sha: '5f55ac6c37dc9dee3b8e062a4f30e9ef7a32ad7eff40f69329f2dc36a3388eb4',
    branch: 'SOMEBRANCH',
    prNumber: '51',
    prUser: 'rafkhan'
  };

  var tag = generateTagFromEnv(tagEnvOverride);

  var imageConfig = {
    dockerEmail: dockerEmail,
    dockerUser: dockerUser,
    dockerPass: dockerPass,
    dockerRepo: dockerRepo,
    dockerFile: dockerFile,
    tag: tag
  };

  return buildDockerImage(imageConfig);
}


module.exports = {
  clusternate: clusternate
};


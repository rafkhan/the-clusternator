'use strict';

var q = require('q');
var R = require('ramda');
var fs = require('fs');
var cp = require('child_process');
//var rp = require('request-promise');
var log = require('winston');

var util = require('./util');


var TAG_DELIM = '.';

// TODO deal with this...
var BOOT_2_DOCKER_EXPORT = 'export DOCKER_HOST=tcp://192.168.59.103:2376 && export DOCKER_CERT_PATH=/Users/rafy/.boot2docker/certs/boot2docker-vm && export DOCKER_TLS_VERIFY=1';

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

  var sha = u.sha || e.CIRCLE_SHA1;
  var shaHead = R.take(10, sha);
  var branch = u.branch || e.CIRCLE_BRANCH;

  // TODO not require this
  var prNumber = u.prNumber || e.CIRCLE_PR_NUMBER;
  var prUser = u.prUser || e.CIRCLE_PR_USERNAME;

  var tag = [shaHead, branch, prUser, prNumber].join(TAG_DELIM);

  return tag;
}


// Build docker image
//
function buildDockerImage(config) {
  config = config || {};

  var uniqueTag = config.tag;
  var repo = config.repo;

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

  log.info(cmd);

  // TODO Deal with this...
  if(BOOT_2_DOCKER_EXPORT) {
    cmd = BOOT_2_DOCKER_EXPORT + ' && ' + cmd;
  }

  var d = q.defer();

  // TODO switch to spawn
  cp.exec(cmd, function(err, stdout, stderr) {
    if(err) {
      d.reject({
        err: err,
        stderr: stderr
      });
    } else {
      d.resolve({
        output: stdout,
        image: imgName
      });
    }
  });


  return d.promise;
}

//var clusternatorBuildApiEndpoint = '/unit';

//function triggerAppBuild(config) {
  //var clusternatorHost = config.clusternatorHost;
  //if(!clusternatorHost) {
    //return q.reject('Build trigger requires clusternator server host');
  //}

  //var reqBody = {};

  //var endpoint = clusternatorHost + clusternatorBuildApiEndpoint;
  //return rp.post(endpoint, reqBody);
//}


function clusternate(config) {
  config = config || {};
  var e = process.env;

  var dockerEmail = config.dockerEmail || e.CLUSTERNATOR_DOCKER_EMAIL;
  var dockerUser  = config.dockerUser  || e.CLUSTERNATOR_DOCKER_USER;
  var dockerPass  = config.dockerPass  || e.CLUSTERNATOR_DOCKER_PASSWORD;

  if(!dockerEmail || !dockerUser || !dockerPass ) {
    return q.reject('Missing docker credentials');
  }

  var appDefContents;
  var appDefPath = config.appDef;

  if(!appDefPath) {
    return q.reject('Missing app definition file path');
  }

  try {
    appDefContents = JSON.parse(fs.readFileSync(appDefPath, 'utf8'));
  } catch(err) {
    return q.reject(err);
  }


  // XXX
  // simulated env
  var tagEnvOverride = {
    sha: '5f55ac6c37dc9dee3b8e062a4f30e9ef7a32ad7eff40f69329f2dc36a3388eb4',
    branch: 'SOMEBRANCH',
    prNumber: '51',
    prUser: 'rafkhan'
  };


  /**
   * Builds a container definition, returns promise with image name
   *
   * If no dockerfile is specified, it will take the "image" property
   * VERBATIM and use that as the docker image name to load
   */
  function runBuild(containerDef) {
    var containerName = containerDef.name;
    var imageRepo     = containerDef.repo;

    var tag = generateTagFromEnv(tagEnvOverride);

    var imageConfig = {
      dockerEmail: dockerEmail,
      dockerUser: dockerUser,
      dockerPass: dockerPass,
      tag: tag,
      repo: imageRepo
    };

    // TODO move all of this crap to constants at the top
    var OMITTED_KEYS = ['repo', 'dockerFile', 'registry', // nonstandard
                        'image']; // removed to ensure we write our own image

    // The container definition we will eventually return
    var respContainerDef = R.omit(OMITTED_KEYS,
                                  R.clone(containerDef));

    // TODO move this up
    function updateImageRef(imageRef, def) {
      return R.assoc('image', imageRef, def);
    }

    if(containerDef.dockerFile) {
      log.info('Building', containerName);

      // TODO look for dockerfile
      var appDefPathHead = R.take(R.lastIndexOf('/', appDefPath), appDefPath);
      var dockerFileDir  = appDefPathHead + '/' + containerDef.dockerFile;

      imageConfig.dockerFile = dockerFileDir;

      return buildDockerImage(imageConfig)
                .then(function(resp) {
                  log.info('Docker build output', resp.output);
                  return updateImageRef(resp.image, respContainerDef);
                }, function(err) {
                  log.error('DOCKER BUILD STDERR', err.stderr);

                  // oops, sorry for the mixed error handling here
                  return q.reject(err.err || err);
                });

    } else {
      var defaultImage = containerDef.image;
      if(!defaultImage) {
        return q.reject('No default image specified in "image" property for ' +
                        containerDef.name);

      } else {
        log.info('Using image',   util.quote(defaultImage),
                 'for container', util.quote(containerName));

        var updatedContainerDefinition =
          updateImageRef(defaultImage, respContainerDef);
        return q.resolve(updatedContainerDefinition);
      }
    }
  }

  var modifiedContainerDefs = R.map(runBuild,
      appDefContents.tasks[0].containerDefinitions);

  return q.all(modifiedContainerDefs)
          .then(function(defs) {
            appDefContents.tasks[0].containerDefinitions = defs;
            return appDefContents;
          });
}


module.exports = {
  clusternate: clusternate
};


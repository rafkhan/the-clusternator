'use strict';
/**
 * This module is seemingly deprecated
 * @module circleCIClient
 * @deprecated
 * @todo determine if this can be deleted
 */

const fs = require('fs');
const q = require('q');
const R = require('ramda');
const request = require('superagent');
const resourceId = require('../resource-identifier');

const clusternateEndpoint = '/clusternate';

const isCircleCI = process.env.CIRCLECI === 'true';


function updateContainerDefs(tag, containerDef) {
  const imgSrc = containerDef.image;
  const newImg = imgSrc.replace(/\$TAG/g, tag);

  // create new object with correct $TAG
  return R.assoc('image', newImg, containerDef);
}


// TODO move to different file
function replaceTagInAppdef(appdef, tag) {
  const imgUpdater = R.map(R.curry(updateContainerDefs)(tag));

  const updatedTasks = R.map((task) => {
    const updatedContainerDefs = imgUpdater(task.containerDefinitions);
    // return new obj with updated task
    return R.assoc('containerDefinitions',
                   updatedContainerDefs,
                   task);
  }, appdef.tasks);

  return R.assoc('tasks', updatedTasks, appdef);
}


function push(host, appdef, tag) {
  if(!isCircleCI) {
    return q.reject('Not running on circle CI.');
  }

  if(!host || !appdef || !tag) {
    return q.reject('Missing arguments');
  }


  // Strip ending / from host string
  const strippedHost = host.replace(/\/$/,'');
  const apiEndpoint = strippedHost + clusternateEndpoint;

  const d = q.defer();

  const readFile = q.nfbind(fs.readFile);
  readFile(appdef, 'utf8')
    .then((appdefText) => {
      const appdef = JSON.parse(appdefText);
      const taggedAppdef = replaceTagInAppdef(appdef, tag);
      const taggedAppdefText = JSON.stringify(taggedAppdef, null, 2);

      return {
        appdef: taggedAppdefText,
        tag: tag
      };
    }, (err) => {
      const msg = 'Can not read appdef from ' + appdef;
      return msg;
    })

    .then((reqBody) => {
      request
        .post(apiEndpoint)
        .send(reqBody)
        .end((err, res) => { // TODO q short syntax
          if(err) {
            // Clean up error response
            d.reject(err);
          } else {
            const parsedRes = JSON.parse(res.text);
            const data = {};
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
  const env = process.env;
  const tagOpts = {};

  if(env.CIRCLE_PR_NUMBER) {
    tagOpts.pr = env.CIRCLE_PR_NUMBER;
  }

  if(env.CIRCLE_PROJECT_REPONAME) {
    tagOpts.pid = env.CIRCLE_PROJECT_REPONAME;
  }

  const time = Date.now();
  tagOpts.time = time;

  const rid = resourceId.generateRID(tagOpts);

  return {
    tag: rid,
    opts: tagOpts
  };
}



module.exports = {
  push: push,
  generateTagFromEnv: generateTagFromEnv
};

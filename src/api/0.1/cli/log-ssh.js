'use strict';
const cn = require('../js/js-api');
const clusternatorJson = require('../project-fs/clusternator-json');

module.exports = {
  listSSHAbleInstances
};

function listSSHAbleInstances() {
  return clusternatorJson
    .get()
    .then((cJson) => cn.listSSHAbleInstances(cJson.projectId));
}


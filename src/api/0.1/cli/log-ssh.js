'use strict';
const cn = require('../js/js-api');
const cmn = require('../common');

const clusternatorJson = cmn.src('clusternator-json');

module.exports = {
  listSSHAbleInstances
};

function listSSHAbleInstances() {
  return clusternatorJson
    .get()
    .then((cJson) => cn.listSSHAbleInstances(cJson.projectId));
}


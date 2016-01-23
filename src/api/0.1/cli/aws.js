'use strict';

const cn = require('../js/js-api');
const cmn = require('../common');

const clusternatorJson = cmn.src('clusternator-json');

module.exports = {
  listProjects: cn.listProjects,
  describeServices
};

/**
 * @returns {Q.Promise}
 */
function describeServices() {

  return clusternatorJson
    .get()
    .then((config) => cn
      .describeProject(config.projectId));
}

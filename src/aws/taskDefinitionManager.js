'use strict';

const common = require('./common');
const util = require('../util');

function getTaskDefinitionManager(ecs) {
  ecs = util.makePromiseApi(ecs);

  function createTaskDefinition(taskDef) {
    if(!taskDef) {
      throw 'This function requires a configuration object';
    }

    return ecs.registerTaskDefinition(taskDef);
  }

  /**
   * List all clusters
   * @return {Q.Promise.<string[]>}
   */
  function list() {
    return ecs.listTaskDefinitions({})
      .then((list) => list
        .taskDefinitionArns
        .filter(common.filterValidArns)
      );
  }

  /**
   * @returns {Promise.<string[]>}
   */
  function listFamilies() {
    return ecs.listTaskDefinitionFamilies({})
      .then((list) => list
        .families
      );
  }

  /**
   * @param {string} projectId
   * @returns {Request|Promise.<T>}
   */
  function listProject(projectId) {
    return list()
      .then((list) => list
        .filter(common.getProjectIdFilter(projectId)));
  }

  /**
   * @param {string} projectId
   * @param {string} pr
   * @returns {Promise.<string[]>}
   */
  function listPr(projectId, pr) {
    return list()
      .then((list) => list
        .filter(common.getPrFilter(projectId, pr)));
  }

  /**
   * @param {string} projectId
   * @param {string} deployment
   * @returns {Promise.<string[]>}
   */
  function listDeployment(projectId, deployment) {
    return list()
      .then((list) => list
        .filter(common.getDeploymentFilter(projectId, deployment)));
  }



  return {
    create: createTaskDefinition,
    list,
    listProject,
    listPr,
    listDeployment,
    listFamilies
  };
}


module.exports = getTaskDefinitionManager;

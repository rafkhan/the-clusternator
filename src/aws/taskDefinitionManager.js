'use strict';

var Q = require('q'),
  util = require('../util');

function getTaskDefinitionManager(ecs) {
  ecs = util.makePromiseApi(ecs);

  function createTaskDefinition(taskDef) {
    if(!taskDef) {
      throw 'This function requires a configuration object';
    }

    return ecs.registerTaskDefinition(taskDef);
  }

  return {
    create: createTaskDefinition
  };
}


module.exports = getTaskDefinitionManager;

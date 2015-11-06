'use strict';

var Q = require('q');

function getTaskDefinitionManager(ecs) {

  function createTaskDefinition(taskDef) {
    if(!taskDef) {
      throw 'This function requires a configuration object';
    }

    return Q.nbind(ecs.registerTaskDefinition, ecs)(taskDef);
  }

  return {
    create: createTaskDefinition
  };
}


module.exports = getTaskDefinitionManager;

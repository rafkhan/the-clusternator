'use strict';

var Q = require('q');

function getTaskDefinitionManager(ecs) {

  /**
   * TODO THIS METHOD WHATEVER ITS IMPLEMENTATION WILL BE,
   * SHOULDNT BE HERE
   *
   * @param config Object
   *
   * config should look like the following:
   * {
   *   containers: [
   *     //container description object
   *   ],
   *
   *   // See http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#registerTaskDefinition-property
   *   apiConfig: {}
   * }
   *
   * container description objects should look like the following:
   * {
   *   name:     'rangle-app-frontend-nginx',
   *   imageSrc: 'hub.docker.com/rangle/whatever',
   *   tag:      'pr-51',
   *   ports:     [
   *     { real: 10051, virtual: 80 },
   *     ...
   *   ]
   * }
   *
   * NOTE: all containers described in `containers` property
   *       will be appended to containers defined in the
   *       `apiConfig` property if supplied.
   *
   * TODO TODO TODO TODO TODO TODO TODO
   */

  function createTaskDefinition(taskDef) {
    if (!taskDef) {
      throw 'This function requires a configuration object';
    }

    return Q.nbind(ecs.registerTaskDefinition, ecs)(taskDef);
  }

  return {
    createTaskDefinition: createTaskDefinition
  };
}

module.exports = getTaskDefinitionManager;
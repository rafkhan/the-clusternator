'use strict';

var Q = require('q');
var R = require('ramda');

var DEFAULT_TASK_DEFINITION = {};

function getTaskDefinitionManager(ecs) {

  /**
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
   */
  function createTaskDefinition(config) {
    if(!config) {
      throw 'This function requires a configuration object';
    }

    var params = R.merge(DEFAULT_TASK_DEFINITION, config);

    return Q.nbind(ecs.registerTaskDefinition, ecs)(params);
  }

  return {
    createTaskDefinition: createTaskDefinition
  };
}


module.exports = getTaskDefinitionManager;


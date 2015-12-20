'use strict';

var q = require('q');
var R = require('ramda');
var util = require('../util');

var TaskDefinitionManager = require('./taskDefinitionManager');

function getTaskServiceManager(ecs) {
  ecs = util.makePromiseApi(ecs);

  var taskDefinitionManager = TaskDefinitionManager(ecs);

  function listServices(clusterArn) {
    if (!clusterArn) {
      throw 'Requires cluster ARN';
    }

    var params = {
      cluster: clusterArn
    };

    return ecs.listServices(params);
  }

  function updateService(clusterArn, serviceArn, update) {
    if (!clusterArn) {
      throw 'Requires cluster ARN';
    }

    if (!serviceArn) {
      throw 'Requires service ARN';
    }

    var params = {
      cluster: clusterArn,
      service: serviceArn,
    };

    params = R.merge(params, update);

    return ecs.updateService(params);
  }

  function deleteService(clusterArn, serviceArn) {
    if (!clusterArn) {
      throw 'Requires cluster ARN';
    }

    if (!serviceArn) {
      throw 'Requires service ARN';
    }

    var params = {
      cluster: clusterArn,
      service: serviceArn,
    };

    return ecs.deleteService(params);
  }

  /**
   * Stops and destroys all services on `clusterArn`
   */
  function deleteAllServicesOnCluster(clusterArn) {

    function stopService(serviceArn) {
      return updateService(clusterArn, serviceArn, {
          desiredCount: 0
        })
        .then(R.prop('service'), q.reject);
    }

    function stopAllServices(serviceArns) {
      var stopPromises = R.map(stopService, serviceArns);
      return q.all(stopPromises);
    }

    function destroyService(serviceArn) {
      return deleteService(clusterArn, serviceArn)
        .then(R.prop('service'), q.reject);
    }

    function destroyAllServices(serviceArns) {
      var destroyPromise = R.map(destroyService, serviceArns);
      return q.all(destroyPromise);
    }

    return listServices(clusterArn)
      .then(R.prop('serviceArns'), q.reject)
      .then(stopAllServices, q.reject)
      .then(R.map(R.prop('serviceArn')), q.reject)
      .then(destroyAllServices, q.reject);
  }

  /**
   * This is the cool part.
   */
  function createTasksAndServicesOnCluster(clusterArn, serviceName, appDef) {

    // TODO refactor this to be elsewhere
    function createServiceFromTaskAndStart(taskDef) {
      var task = taskDef.taskDefinition;

      var params = {
        cluster: clusterArn,
        taskDefinition: task.taskDefinitionArn,
        desiredCount: 1, //TODO you should be able to change this
        serviceName: serviceName
      };

      return ecs.createService(params);
    }

    function createTaskAndService(task) {
      return taskDefinitionManager.create(task)
        .then((t) => {
          util.info('Created task',
            t.taskDefinition.taskDefinitionArn);
          return t;
        })
        .then(createServiceFromTaskAndStart, q.reject);
    }

    var taskDefPromises = R.map(createTaskAndService,
      appDef.tasks);

    return q.all(taskDefPromises);
  }

  return {
    destroy: deleteAllServicesOnCluster,
    create: createTasksAndServicesOnCluster
  };
}

module.exports = getTaskServiceManager;

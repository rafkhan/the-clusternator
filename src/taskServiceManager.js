'use strict';

var q = require('q');
var R = require('ramda');

var util = require('./util');
var TaskDefinitionManager = require('./taskDefinitionManager');

function getTaskServiceManager(ecs) {

  var taskDefinitionManager = TaskDefinitionManager(ecs);

  function listServices(clusterArn) {
    if(!clusterArn) {
      throw 'Requires cluster ARN';
    }

    var params = {
      cluster: clusterArn
    };

    return q.nbind(ecs.listServices, ecs)(params);
  }

  function updateService(clusterArn, serviceArn, update) {
    if(!clusterArn) {
      throw 'Requires cluster ARN';
    }

    if(!serviceArn) {
      throw 'Requires service ARN';
    }

    var params = {
      cluster: clusterArn,
      service: serviceArn,
    };

    params = R.merge(params, update);

    return q.nbind(ecs.updateService, ecs)(params);
  }

  function deleteService(clusterArn, serviceArn) {
    if(!clusterArn) {
      throw 'Requires cluster ARN';
    }

    if(!serviceArn) {
      throw 'Requires service ARN';
    }

    var params = {
      cluster: clusterArn,
      service: serviceArn,
    };

    return q.nbind(ecs.deleteService, ecs)(params);
  }

  /**
   * Stops and destroys all services on `clusterArn`
   */
  function deleteAllServicesOnCluster(clusterArn) {

    function stopService(serviceArn) {
      return updateService(clusterArn, serviceArn, { desiredCount: 0 })
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
   *
   * This function is responsible
   */
  function createTasksAndServicesOnCluster(clusterArn, appDef) {

    // TODO refactor this to be elsewhere
    function createServiceFromTaskAndStart(taskDef) {
      var task = taskDef.taskDefinition;

      var serviceName = task.family + '-' + task.revision + '-service';

      var params = {
        cluster: clusterArn,
        taskDefinition: task.taskDefinitionArn,
        desiredCount: 1, //TODO you should be able to change this
        serviceName: serviceName
      };

      return q.nbind(ecs.createService, ecs)(params);
    }

    function createTaskAndService(task) {
      return taskDefinitionManager.createTaskDefinition(task)
                                  .then((t) => {
                                    console.log('Created task',
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
    deleteAppOnCluster: deleteAllServicesOnCluster,
    createAppOnCluster: createTasksAndServicesOnCluster
  };
}

module.exports = getTaskServiceManager;

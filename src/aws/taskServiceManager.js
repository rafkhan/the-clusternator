'use strict';
/**
 * Simplifies dealing with AWS's ECS taskServices
 *
 * @module aws/taskServiceManager
 */

const SERVICE_POLL_DELAY = 15000;

const q = require('q');
const R = require('ramda');
const util = require('../util');

const TaskDefinitionManager = require('./taskDefinitionManager');

function getTaskServiceManager(ecs) {
  ecs = util.makePromiseApi(ecs);

  const taskDefinitionManager = TaskDefinitionManager(ecs);

  function listServices(clusterArn) {
    if (!clusterArn) {
      throw new Error('Requires cluster ARN');
    }

    const params = {
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

    let params = {
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

    const params = {
      cluster: clusterArn,
      service: serviceArn
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
      const stopPromises = R.map(stopService, serviceArns);
      return q.all(stopPromises);
    }

    function destroyService(serviceArn) {
      return deleteService(clusterArn, serviceArn)
        .then(R.prop('service'), q.reject);
    }

    function destroyAllServices(serviceArns) {
      const destroyPromise = R.map(destroyService, serviceArns);
      return q.all(destroyPromise)
              .then(() => {
                return serviceDrained(clusterArn, serviceArns);
              });
    }

    return listServices(clusterArn)
      .then(R.prop('serviceArns'), q.reject)
      .then(stopAllServices, q.reject)
      .then(R.map(R.prop('serviceArn')), q.reject)
      .then(destroyAllServices, q.reject);
  }

  function serviceStatus(result) {
    if (!result.services || !result.services.length) {
      return -1;
    }
    let isSteady = 1;
    result.services[0].events.forEach((event) => {
      util.debug(`Polling service for ready check: ${event.message}`);
      if (event.message.indexOf('steady state') === -1) {
        return;
      }
      isSteady = 0;
    });
    return isSteady;
  }

  function serviceReady(arns) {
    const d = q.defer();
    ecs
      .describeServices({
        services: [ arns.service ],
        cluster: arns.cluster })
      .then((result) => {
        const status = serviceStatus(result);
        if (status < 0) {
          d.reject(new Error('Error polling new service: ' + arns));
          return;
        }
        if (status === 0) {
          util.info('Service has reached a steady state');
          d.resolve();
        } else {
          setTimeout(() => {
            serviceReady(arns)
              .then(d.resolve, d.reject);
          }, SERVICE_POLL_DELAY);
        }})
      .fail(d.reject);
    return d.promise;
  }

  function checkForInactiveService(result) {
    if (!result.services || !result.services.length) {
      return false;
    }

    const service = result.services[0];
    return service.status === 'INACTIVE';
  }

  function serviceDrained(clusterArn, serviceArns) {
    const d = q.defer();
    ecs
      .describeServices({
        services: serviceArns,
        cluster: clusterArn })
      .then((result) => {
        const isInactive = checkForInactiveService(result);
        if (isInactive) {
          util.info('Service has drained');
          d.resolve();
        } else {
          util.info('Service is draining');
          setTimeout(() => {
            serviceDrained(clusterArn, serviceArns)
              .then(d.resolve, d.reject);
          }, SERVICE_POLL_DELAY);
        }})
      .fail(d.reject);
    return d.promise;
  }

  /**
   * This is the cool part.
   *
   * clusterArn isn't actually an ARN?
   */
  function createTasksAndServicesOnCluster(clusterArn, serviceName, appDef) {

    // TODO refactor this to be elsewhere
    function createServiceFromTaskAndStart(taskDef) {
      const task = taskDef.taskDefinition;

      const params = {
        cluster: clusterArn,
        taskDefinition: task.taskDefinitionArn,
        desiredCount: 1, //TODO you should be able to change this
        serviceName: serviceName
      };

      return ecs.createService(params)
        .then((result) => serviceReady({
          service: result.service.serviceArn,
          cluster: result.service.clusterArn })
          .then(() => result ));
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

    if(typeof appDef === 'string') {
      appDef = JSON.parse(appDef);
    }

    const taskDefPromises = R.map(createTaskAndService,
      appDef.tasks);

    return q.all(taskDefPromises);
  }

  return {
    create: createTasksAndServicesOnCluster,
    destroy: deleteAllServicesOnCluster,
    list: listServices
  };
}

module.exports = getTaskServiceManager;

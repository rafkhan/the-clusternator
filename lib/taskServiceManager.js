'use strict';

var q = require('q');
var R = require('ramda');

var util = require('./util');

function getTaskServiceManager(ecs) {

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

  function deleteAllServices(clusterArn) {

    function deleteAfterStop(service) {
      return deleteService(clusterArn, service.serviceArn);
    }

    function stopService(serviceArn) {
      return updateService(clusterArn, serviceArn, { desiredCount: 0 })
                 .then(R.prop('service'), util.errLog);
    }

    function stopAllServices(serviceArns) {
      var stopPromises = R.map(stopService, serviceArns);
      return q.all(stopPromises);
    }


    return listServices(clusterArn)
               .then(util.plog)
               .then(R.prop('serviceArns'), util.errLog)
               .then(stopAllServices, util.errLog);
  }

  return {
    deleteAllServices: deleteAllServices
  };
}

module.exports = getTaskServiceManager;

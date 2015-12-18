'use strict';

const Q = require('q'),
  R = require('ramda'),
  rid = require('../resourceIdentifier'),
  util = require('../util');

function filterValidArns(arn) {
  var splits = arn.split('/'),
    name = splits[splits.length - 1];
  return rid.parseRID(name);
}

function getClusterManager(ecs) {
  ecs = util.makePromiseApi(ecs);

  function createCluster(clusterName) {
    if (!clusterName) {
      return Q.reject(new Error('createCluster: missing, or invalid config'));
    }
    var params = {
      clusterName: clusterName
    };

    return ecs.createCluster(params);
  }

  function deleteCluster(name) {
    if (!name) {
      return Q.reject(new Error('deleteCluster: missing, or invalid config'));
    }
    var params = {
      cluster: name
    };

    return ecs.deleteCluster(params);
  }
  /**
   * List all clusters
   */
  function listClusters() {
    return ecs.listClusters({})
      .then(function(list) {
        return list.clusterArns
          .filter(filterValidArns);
      });
  }

  /**
   * Get information on a cluster by name or ARN
   *
   * @param cluster String
   */
  function describeCluster(clusterName) {
    var params = {
      clusters: [clusterName]
    };
    return ecs
      .describeClusters(params)
      .then(function(results) {
        var result = R.filter(function(c) {
          return c.clusterName === clusterName;
        }, results.clusters);

        if (!result[0]) {
          throw new Error('Cluster does not exist');
        }

        return result[0];
      });
  }

  function deregister(instanceArn, clusterId) {
    return ecs.deregisterContainerInstance({
      cluster: clusterId,
      containerInstance: instanceArn
    });
  }

  function listContainers(clusterId) {
    return ecs
      .listContainerInstances({
        cluster: clusterId
      })
      .then(function(result) {
        if (result.containerInstanceArns) {
          return result.containerInstanceArns;
        }
        throw new Error('Cluster: listContainers: unexpected data');
      });
  }


  function listServices(cluster) {
    return ecs
      .listServices({
        cluster
      }).then((services) => {
        return services.serviceArns.filter((service) => service.length);
      });
  }

  function describeServices(cluster, services) {
    return ecs
      .describeServices({
        cluster,
        services
      });
  }

  function describePr(projectId, pr) {

  }

  function describeDeployment(projectId, sha) {

  }

  function identity(o) {
    return o;
  }

  function getProjectIdFilter(projectId) {
    return (arn) => {
      var arnParts = arn.split('/').filter(identity),
        parts = rid.parseRID(arnParts[arnParts.length - 1]);
      if (parts.pid === projectId) {
        return true;
      }
      return false;
    };
  }

  function promiseServiceDescription(cluster) {
    return listServices(cluster)
      .then((services) => {
        if (services.length) {
          return describeServices(cluster, services);
        }
        return null;
      });
  }

  function processServiceDescription(description) {
    if (description && description.services) {
      return {
        arn: description.services[0].serviceArn,
        events: description.services[0].events.shift().message
      }
    }
    return null;
  }

  function processServiceDescriptions(descriptions) {
    var formatted = descriptions
      .map(processServiceDescription)
      .filter(identity);
    util.info(JSON.stringify(formatted, null, 2));
  }

  function describeProject(projectId) {
    return listClusters()
      .then((list) => Q
        .all(list
          .filter(getProjectIdFilter(projectId))
          .map(promiseServiceDescription))
      )
      .then(processServiceDescriptions);
  }

  return {
    create: createCluster,
    list: listClusters,
    listContainers,
    describeProject,
    describePr,
    describeDeployment,
    describe: describeCluster,
    destroy: deleteCluster,
    deregister: deregister
  };
}

module.exports = getClusterManager;

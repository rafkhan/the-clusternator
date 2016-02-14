'use strict';
/**
 * Encapsualtes functions relating to managing/deploying AWS ECS clusters
 *
 * @module aws/clusterManager
 */

const Q = require('q');
const R = require('ramda');
const common = require('./common');
const util = require('../util');

function getClusterManager(ecs) {
  ecs = util.makePromiseApi(ecs);

  /**
   * @param {string} clusterName
   * @returns {Q.Promise}
   */
  function createCluster(clusterName) {
    if (!clusterName) {
      return Q.reject(new Error('createCluster: missing, or invalid config'));
    }

    return ecs.createCluster({
      clusterName
    });
  }

  /**
   * @param {string} cluster
   * @returns {Q.Promise}
   */
  function deleteCluster(cluster) {
    if (!cluster) {
      return Q.reject(new Error('deleteCluster: missing, or invalid config'));
    }

    return ecs.deleteCluster({
      cluster
    });
  }

  /**
   * List all clusters
   * @return {Q.Promise.<string[]>}
   */
  function listClusters() {
    return ecs.listClusters({})
      .then((list) => list
        .clusterArns
        .filter(common.filterValidArns)
      );
  }

  /**
   * Get information on a cluster by name or ARN
   *
   * @param {string} clusterName
   */
  function describeCluster(clusterName) {
    const params = {
      clusters: [clusterName]
    };
    return ecs
      .describeClusters(params)
      .then(function(results) {
        const result = R.filter(function(c) {
          return c.clusterName === clusterName;
        }, results.clusters);

        if (!result[0]) {
          throw new Error('Cluster does not exist');
        }

        return result[0];
      });
  }

  /**
   * @param {string} instanceArn
   * @param {string} clusterId
   * @returns {Q.Promise}
   */
  function deregister(instanceArn, clusterId) {
    return ecs.deregisterContainerInstance({
      cluster: clusterId,
      containerInstance: instanceArn
    });
  }

  /**
   * @param {string} clusterId
   * @returns {Promise.<string[]>}
   */
  function listContainers(clusterId) {
    return ecs
      .listContainerInstances({
        cluster: clusterId
      })
      .then((result) => {
        if (result.containerInstanceArns) {
          return result.containerInstanceArns;
        }
        throw new Error('Cluster: listContainers: unexpected data');
      });
  }


  /**
   * @param {string} cluster
   * @returns {Promise.<string[]>}
   */
  function listServices(cluster) {
    return ecs
      .listServices({
        cluster
      }).then((services) => {
        return services.serviceArns.filter((service) => service.length);
      });
  }

  /**
   * @param {string} cluster
   * @param {string[]} services
   * @returns {Q.Promise}
   */
  function describeServices(cluster, services) {
    return ecs
      .describeServices({
        cluster,
        services
      });
  }

  function describePr(projectId, pr) {

  }

  function describeDeployment(projectId) {

  }

  /**
   * @param {*} o
   * @returns {*}
   */
  function identity(o) {
    return o;
  }

  /**
   * @param {string} cluster
   * @returns {Promise.<AWSServiceDescription>}
   */
  function promiseServiceDescription(cluster) {
    return listServices(cluster)
      .then((services) => {
        if (services.length) {
          return describeServices(cluster, services);
        }
        return null;
      });
  }

  /**
   * @param {AWSServiceDescription} description
   * @returns {ClusternatorServiceDescription}
   */
  function processServiceDescription(description) {
    if (description && description.services) {
      return {
        serviceArn: description.services[0].serviceArn,
        clusterArn: description.services[0].clusterArn,
        desiredCount: description.services[0].desiredCount,
        pendingCount: description.services[0].pendingCount,
        status: description.services[0].status,
        deployments: description.services[0].deployments,
        lastEvent: description.services[0].events.shift().message
      };
    }
    return null;
  }

  /**
   * @param {AWSServiceDescription[]} descriptions
   * @returns {ClusternatorServiceDescription[]}
   */
  function processServiceDescriptions(descriptions) {
    const formatted = descriptions
      .map(processServiceDescription)
      .filter(identity);

    return formatted;
  }

  /**
   * @param {string} projectId
   * @returns {Q.Promise<Array>}
   */
  function describeProject(projectId) {
    return listClusters()
      .then((list) => Q
        .all(list
          .filter(common.getProjectIdFilter(projectId))
          .map(promiseServiceDescription)) )
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
    describeServices,
    destroy: deleteCluster,
    deregister: deregister
  };
}

module.exports = getClusterManager;

'use strict';

var Q = require('q');
var R = require('ramda');
var constants = require('../constants');

var DEFAULT_CLUSTER_PARAMS = {
  clusterName: 'CLUSTERNATOR'
};

function getClusterManager(ecs) {

  function createCluster(config) {
    config = config || {};
    var params = R.merge(DEFAULT_CLUSTER_PARAMS, config);

    // must bind to ecs
    return Q.nbind(ecs.createCluster, ecs)(params);
  }

  /**
   * List all clusters
   */
  function listClusters() {
    return Q.nbind(ecs.listClusters, ecs)({});
  }

  /**
   * Get information on a cluster by name or ARN
   *
   * @param cluster String
   */
  function describeCluster(clusterName) {
    var params = { clusters: [ clusterName ] };
    return Q.nbind(ecs.describeClusters, ecs)(params)
            .then(function(results) {
              var result = R.filter(function(c) {
                return c.clusterName === clusterName;
              }, results.clusters);

              if(!result[0]) {
                throw 'Cluster does not exist';
              }

              return result[0];
            });
  }

  return {
    createCluster: createCluster,
    listClusters: listClusters,
    describeCluster: describeCluster
  };
}

module.exports = getClusterManager;

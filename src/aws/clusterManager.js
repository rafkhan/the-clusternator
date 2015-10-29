'use strict';

var Q = require('q');
var R = require('ramda');
var rid = require('../resourceIdentifier');

var DEFAULT_CLUSTER_PARAMS = {
};

function filterValidArns(arn) {
  var splits = arn.split('/'),
  name = splits[splits.length - 1];
  return rid.parseRID(name);
}

function getClusterManager(ecs) {

  function createCluster(config) {
    var name = rid.generateRID(config);
    if (!name) {
      return Q.reject(new Error('missing, or invalid config'));
    }
    var params = R.merge(DEFAULT_CLUSTER_PARAMS, {
      clusterName: name
    });

    // must bind to ecs
    return Q.nbind(ecs.createCluster, ecs)(params);
  }

  /**
  * List all clusters
  */
  function listClusters() {
    return Q.nbind(ecs.listClusters, ecs)({}).then(function (list) {
      return list.clusterArns.filter(filterValidArns);
    });
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

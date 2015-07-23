'use strict';

var Q = require('q');
var R = require('ramda');

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

  return {
    createCluster: createCluster
  };
}

module.exports = getClusterManager;

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

  function createCluster(clusterName) {
    if (!clusterName) {
      return Q.reject(new Error('createCluster: missing, or invalid config'));
    }
    var params = R.merge(DEFAULT_CLUSTER_PARAMS, {
      clusterName: clusterName
    });

    // must bind to ecs
    return Q.nbind(ecs.createCluster, ecs)(params);
  }

function deleteCluster(name) {
    if (!name) {
      return Q.reject(new Error('deleteCluster: missing, or invalid config'));
    }
    var params = {
      cluster: name
    };

    // must bind to ecs
    return Q.nbind(ecs.deleteCluster, ecs)(params);
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
        throw new Error('Cluster does not exist');
      }

      return result[0];
    });
  }

  function deregister(instanceArn, clusterId) {
    return Q.nfbind(ecs.deregisterContainerInstance.bind(ecs), {
        cluster: clusterId,
        containerInstance: instanceArn
    })();
  }

  function listContainers(clusterId) {
    return Q.nbind(ecs.listContainerInstances, ecs)({
      cluster: clusterId
    }).then(function (result) {
        if (result.containerInstanceArns) {
          return result.containerInstanceArns;
        }
        throw new Error('Cluster: listContainers: unexpected data');
    });
  }


  function listServices(cluster) {
    return Q.nfbind(ecs.listServices.bind(ecs), {
      cluster
    })().then((services) => {
      return services.serviceArns.filter((service) => {
        if (service.length) {
          return true;
        }
        return false;
      });
    });
  }

  function describeServices(cluster, services) {
    return Q.nfbind(ecs.describeServices.bind(ecs), {
      cluster,
      services
    })();
  }

  function describePr(pid, pr) {

  }

  function describeDeployment(pid, sha) {

  }

  function identity(o) {
    return o;
  }

  function describeProject(pid) {
    return listClusters().then((list) => {
      var sLists = list.filter((arn) => {
        var arnParts = arn.split('/').filter(identity),
          parts = rid.parseRID(arnParts[arnParts.length - 1]);
        if (parts.pid === pid) {
          return true;
        }
        return false;
      }).map((relevant) => {
        return listServices(relevant).then((services) => {
          if (services.length) {
            return describeServices(relevant, services);
          }
          return null;
        });
      });

      return Q.all(sLists).then((results) => {
        console.log('results', JSON.stringify(
          results.filter(identity), null, 2));
      });
    });
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

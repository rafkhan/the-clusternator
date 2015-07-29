'use strict';

var R = require('ramda');
var AWS = require('aws-sdk');

var util = require('./lib/util');
var EC2Manager = require('./lib/ec2Manager');
var ClusterManager = require('./lib/clusterManager');
var TaskServiceManager = require('./lib/taskServiceManager');

var AWS_REGION = 'us-east-1';
AWS.config.region = AWS_REGION;

var ec2 = new AWS.EC2();
var ec2Manager = EC2Manager(ec2);

var ecs = new AWS.ECS();
var clusterManager = ClusterManager(ecs);
var taskServiceManager = TaskServiceManager(ecs);


/**
 * Updates app running on ECS cluster, this is used to prevent
 * unnecessary creation/destruction of resources. Use with caution.
 *
 * It does this by stopping all tasks and services running on the cluster.
 * Then rebuilds app by it's specification.
 */
function updateApp(clusterName, appDef) {
  console.log('Updating', appDef.name, 'on', clusterName, 'with',
              appDef);

  function loadNewApp() {
    return taskServiceManager.createAppOnCluster(clusterName, appDef);
  }

  return clusterManager.describeCluster(clusterName)
                       .then(R.prop('clusterArn'), util.errLog)
                       .then(taskServiceManager.deleteAppOnCluster,
                             util.errLog)
                       .then(loadNewApp);
}

module.exports = {
  updateApp: updateApp,
  createEC2Instance: ec2Manager.createEC2Instance
};

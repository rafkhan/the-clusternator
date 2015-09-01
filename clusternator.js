'use strict';

require('babel/register');

var q = require('q');
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
  console.log('Updating', appDef.name, 'on', clusterName, 'with app definition',
              '"' + appDef.name + '"');

  function loadNewApp() {
    return taskServiceManager.createAppOnCluster(clusterName, appDef);
  }

  return clusterManager.describeCluster(clusterName)
                       .then(R.prop('clusterArn'), q.reject)
                       .then((clusterArn) => {
                         console.log('Initiating cleanup on', clusterArn);
                         return clusterArn;
                       })

                       .then(taskServiceManager.deleteAppOnCluster, q.reject)
                       .then((args) => {
                         var serviceNames = R.map(R.prop('serviceName'), args);
                         console.log('Deleted services', serviceNames);
                         return args;
                       }, q.reject)

                       .then(loadNewApp, q.reject)
                       .then((services) => {
                         var f = R.compose(R.prop('serviceName'), R.prop('service'));
                         var serviceNames = R.map(f, services);
                         console.log('Initialized services', serviceNames);
                         return services;
                       }, q.reject);
}


/**
 * Creates:
 *  - ECS cluster
 *  - EC2 box with configured agent
 *  - Tasks / services from appDef
 */
function newApp(clusterName, appDef, ec2Config) {
  if(!clusterName) { throw 'Requires clusterName'; }
  if(!appDef)      { throw 'Requires appDef'; }
  if(!ec2Config)   { throw 'Requires ec2Config'; }

  var clusterParams = {
    clusterName: clusterName
  };

  function buildEC2Instance() {
    return ec2Manager.createEC2Instance(ec2Config);
  }

  return clusterManager.createCluster(clusterParams)
                       .then(buildEC2Instance, util.errLog)
                       .then(function() {
                         return taskServiceManager.createAppOnCluster(clusterName, appDef);
                       });
}


module.exports = {
  newApp: newApp,
  updateApp: updateApp,
  createEC2Instance: ec2Manager.createEC2Instance
};

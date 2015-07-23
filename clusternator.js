'use strict';

var R = require('ramda');

function noop(){}

function getCluster(config) {
  console.log('Starting the clusternator');

  if(!config.clusterName) {
   throw 'Config requires cluter name';
  }

  // CHECK IF CLUSTER EXISTS
  // STORE CLUSTER ID


  return {
    createTask: noop,
    listTasks: noop
  };
}

module.exports = getCluster;

'use strict';

var clusternator = require('../clusternator');

function log(x) { console.log(x); }

function updateApp(argv) {

  var clusterName = argv.cluster;
  if(!clusterName) {
    throw 'Missing --cluster argument';
  }

  return function() {
    clusternator.updateApp(clusterName)
                .then(function(data) {
                  console.log(data);
                }, log)
                .then(function() {
                  
                });
  };
}

module.exports = {
  updateApp: updateApp
};

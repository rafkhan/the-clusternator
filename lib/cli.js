'use strict';

var util = require('./util');
var clusternator = require('../clusternator');

function updateApp(argv) {

  var clusterName = argv.cluster;
  if(!clusterName) {
    throw 'Missing --cluster argument';
  }

  var app = {
    name: 'Sample App Name'
  };

  return function() {
    clusternator.updateApp(clusterName, app)
                .then(function(data) {
                  console.log(data);
                }, util.errLog)
                .then(null, util.errLog);
  };
}

module.exports = {
  updateApp: updateApp
};

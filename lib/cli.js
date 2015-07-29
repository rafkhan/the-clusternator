'use strict';

var fs = require('fs');

var util = require('./util');
var clusternator = require('../clusternator');

function updateApp(argv) {

  return function() {
    var clusterName = argv.cluster;
    if(!clusterName) {
      throw 'Missing --cluster argument';
    }

    var appDefPath = argv.app;
    if(!appDefPath) {
      throw 'Requires --app';
    }

    var app = JSON.parse(fs.readFileSync(appDefPath, 'utf8'));

    clusternator.updateApp(clusterName, app)
                .then(function(data) {
                  console.log(data);
                }, util.errLog)
                .then(null, util.errLog);
  };
}

function newEC2Instance(argv) {

  return function() {
    var apiConfig = {
      ClientToken: (new Date()).valueOf().toString()
    };

    var clusterName = argv.name;
    if(!clusterName) {
      throw 'Requires --name';
    }

    var keyPairName = argv.keypair;
    if(!keyPairName) {
      console.log('Consider adding a --keypair');
    } else {
      apiConfig.KeyName = keyPairName;
    }

    var config = {
      clusterName: clusterName,
      apiConfig: apiConfig
    };

    return clusternator.createEC2Instance(config)
                       .then(util.plog, util.errlog);
  };
}

module.exports = {
  updateApp: updateApp,
  newEC2Instance: newEC2Instance
};

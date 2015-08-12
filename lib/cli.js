'use strict';

var fs = require('fs');
var log = require('winston');

var util = require('./util');
var server = require('./server/main');
var circleCIClient = require('./circleCIClient');
var clusternator = require('../clusternator');


function newApp(argv) {
  return function() {
    var clusterName = argv.cluster;
    if(!clusterName) {
      throw 'Missing --cluster argument';
    }

    var appDefPath = argv.app;
    if(!appDefPath) {
      throw 'Requires --app';
    }

    var EC2APIConfig = {
      ClientToken: (new Date()).valueOf().toString()
    };

    var keyPairName = argv.keypair;
    if(!keyPairName) {
      console.log('Consider adding a --keypair');
    } else {
      EC2APIConfig.KeyName = keyPairName;
    }

    var ec2Config = {
      clusterName: clusterName,
      apiConfig: EC2APIConfig
    };

    var app = JSON.parse(fs.readFileSync(appDefPath, 'utf8'));

    return clusternator.newApp(clusterName, app, ec2Config)
                .then(function(data) {
                  console.log(data);
                }, util.errLog)
                .then(null, util.errLog);
  };
}


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

//function newEC2Instance(argv) {

  //return function() {
    //var apiConfig = {
      //ClientToken: (new Date()).valueOf().toString()
    //};

    //var clusterName = argv.name;
    //if(!clusterName) {
      //throw 'Requires --name';
    //}

    //var keyPairName = argv.keypair;
    //if(!keyPairName) {
      //console.log('Consider adding a --keypair');
    //} else {
      //apiConfig.KeyName = keyPairName;
    //}

    //var config = {
      //clusterName: clusterName,
      //apiConfig: apiConfig
    //};

    //return clusternator.createEC2Instance(config)
                       //.then(util.plog, util.errlog);
  //};
//}

function startServer(argv) {
  return function() {
    var config = {};
    config.port = argv.port;
    server.startServer(config);
  };
}

function circleCIBuild(argv) {

  return function() {
    var config = {};

    config.dockerEmail = argv.dockerEmail;
    config.dockerUser = argv.dockerUser;
    config.dockerPass = argv.dockerPass;
    config.appDef = argv.app;
    config.clusternatorHost = argv.clusternatorHost;

    return circleCIClient.clusternate(config)
                         .then(log.info, log.error);
  };
}

module.exports = {
  newApp: newApp,
  updateApp: updateApp,
  //newEC2Instance: newEC2Instance,
  startServer: startServer,
  circleCIBuild: circleCIBuild
};

'use strict';

var fs = require('fs');

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

function startServer() {
  return function() {
    var config = {};
    server.startServer(config);
  };
}

function circleCIBuild(argv) {

  return function() {
    var config = {};

    if(argv.dockerEmail) {
      config.dockerEmail = argv.dockerEmail;
    }

    if(argv.dockerUser) {
      config.dockerUser = argv.dockerUser;
    }

    if(argv.dockerPass) {
      config.dockerPass = argv.dockerPass;
    }

    var dockerFile;

    // TODO check for dockerfile in current directory
    var dockerFileInCurrentDir = false;
    if(dockerFileInCurrentDir) {
      dockerFile = '.';
    } else {
      dockerFile = argv.dockerFile;
    }

    config.dockerFile = dockerFile;

    if(!argv.dockerRepo) {
      throw 'Requires --dockerRepo flag';
    }
    config.dockerRepo = argv.dockerRepo;


    return circleCIClient.clusternate(config)
              .then(function(output) {
                console.log('Docker build output', output);
              }, function(err) {
                console.log('ERR', err.err);
                console.log('STDERR', err.stderr);
              });
  };
}

module.exports = {
  newApp: newApp,
  updateApp: updateApp,
  newEC2Instance: newEC2Instance,
  startServer: startServer,
  circleCIBuild: circleCIBuild
};

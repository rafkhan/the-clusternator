'use strict';

var fs = require('fs');
var path = require('path');
var log = require('winston');

var util = require('./util');
var server = require('./server/main');
var circleCIClient = require('./circleCIClient');
var clusternator = require('../clusternator');


function newApp(argv) {
  return function() {
    var clusterName = argv.cluster;
    var appDefPath = argv.app;

    var EC2APIConfig = {
      ClientToken: (new Date()).valueOf().toString()
    };

    var keyPairName = argv.keypair;
    if(!keyPairName) {
      console.log('Consider adding a --keypair');
    } else {
      EC2APIConfig.KeyName = keyPairName;
    }

    var subnetId = argv['subnet-id'];
    var securityGroup = argv['security-group'];
    if((subnetId && !securityGroup) || (!subnetId && securityGroup)) {
      log.info('You must include both a subnet ID and a security group ID');

    } else if(subnetId && securityGroup) {
      var networkInterfaces = [
        {
          DeviceIndex: 0,
          //NetworkInterfaceId: NETWORK_INTERFACE_ID,
          AssociatePublicIpAddress: true,
          SubnetId: subnetId,
          DeleteOnTermination: true,
          Groups: [securityGroup]
        }
      ];

      EC2APIConfig.NetworkInterfaces = networkInterfaces;
    }


    // Pass in all auth data, will prioritize dockerCfg
    var dockerAuth;
    var dockerCfg = argv['docker-cfg'];
    var dockerEmail = argv['docker-email'];
    var dockerPassword = argv['docker-password'];
    var dockerUsername = argv['docker-username'];

    if(dockerCfg || dockerEmail || dockerPassword || dockerUsername) {
       dockerAuth = {
        cfg: dockerCfg,
        email: dockerEmail,
        password: dockerPassword,
        username: dockerUsername
      };
    }


    var ec2Config = {
      auth: dockerAuth,
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
    var appDefPath = argv.app;

    var app = JSON.parse(fs.readFileSync(appDefPath, 'utf8'));

    return clusternator.updateApp(clusterName, app);
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
    config.keypair = argv.keypair;

    return circleCIClient.clusternate(config)
                          .then(function(resp) {
                            console.log(resp);
                          }, log.error);
  };
}

function createAppDefinition() {

  return function() {
    var defaultAppPath = path.resolve(__dirname,
                                      '../examples/DEFAULT.json');
    var defaultApp = JSON.parse(
        fs.readFileSync(defaultAppPath, 'utf8'));

    var prettyString = JSON.stringify(defaultApp, null, 2);
    console.log(prettyString);
  };
}

module.exports = {
  newApp: newApp,
  updateApp: updateApp,
  //newEC2Instance: newEC2Instance,
  startServer: startServer,
  circleCIBuild: circleCIBuild,
  createAppDefinition: createAppDefinition
};

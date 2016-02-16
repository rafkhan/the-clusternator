'use strict';
/**
 * This/these are legacy CLI commands, they are deprecated
 * @module api/'0.1'/cli/legacyCli
 * @deprecated
 */
const UTF8 = 'utf8';

const fs = require('fs');
const path = require('path');
const util = require('../../../util');
const circleCIClient = require('../../../client/circleCIClient');
const clusternator = require('../../../clusternator');
const constants = require('../../../constants');


function newApp(argv) {
  return () => {
    const clusterName = argv.cluster;
    const appDefPath = argv.app;

    const EC2APIConfig = {
      ClientToken: (new Date()).valueOf().toString()
    };

    const keyPairName = argv.keypair;
    if (!keyPairName) {
      util.info('Consider adding a --keypair');
    } else {
      EC2APIConfig.KeyName = keyPairName;
    }

    const subnetId = argv['subnet-id'];
    const securityGroup = argv['security-group'];
    if ((subnetId && !securityGroup) || (!subnetId && securityGroup)) {
      util.info('You must include both a subnet ID and a security group ID');

    } else if (subnetId && securityGroup) {
      const networkInterfaces = [{
        DeviceIndex: 0,
        //NetworkInterfaceId: NETWORK_INTERFACE_ID,
        AssociatePublicIpAddress: true,
        SubnetId: subnetId,
        DeleteOnTermination: true,
        Groups: [securityGroup]
      }];

      EC2APIConfig.NetworkInterfaces = networkInterfaces;
    }


    // Pass in all auth data, will prioritize dockerCfg
    let dockerAuth;
    const dockerCfg = argv['docker-cfg'];
    const dockerEmail = argv['docker-email'];
    const dockerPassword = argv['docker-password'];
    const dockerUsername = argv['docker-username'];

    if (dockerCfg || dockerEmail || dockerPassword || dockerUsername) {
      dockerAuth = {
        cfg: dockerCfg,
        email: dockerEmail,
        password: dockerPassword,
        username: dockerUsername
      };
    }


    const ec2Config = {
      auth: dockerAuth,
      clusterName: clusterName,
      apiConfig: EC2APIConfig
    };

    const app = JSON.parse(fs.readFileSync(appDefPath, UTF8));

    return clusternator.newApp(clusterName, app, ec2Config)
      .then(function(data) {
        util.info(data);
      }, util.errLog)
      .then(null, util.errLog);
    //TODO REMOVE THAT
  };
}

function updateApp(argv) {

  return function() {
    const clusterName = argv.cluster;
    const appDefPath = argv.app;

    const app = JSON.parse(fs.readFileSync(appDefPath, UTF8));

    return clusternator.updateApp(clusterName, app);
  };
}


function destroyApp(argv) {
  return function() {
    const clusterName = argv.cluster;
    return clusternator.destroyApp(clusterName);
  };
}

function createAppDefinition() {

  return function() {
    const defaultAppPath = path.resolve(__dirname,
      '../examples/DEFAULT.json');
    const defaultApp = JSON.parse(
      fs.readFileSync(defaultAppPath, UTF8));

    const prettyString = JSON.stringify(defaultApp, null, 2);
    util.info(prettyString);
  };
}


module.exports = {
  newApp,
  updateApp,
  destroyApp,
  createAppDefinition
};

'use strict';

var Q = require('q');
var R = require('ramda');


var AMI_ID = 'ami-8da458e6'; // amzn-ami-2015.03.d-amazon-ecs-optimized
var EC2_INSTANCE_TYPE = 't2.micro';

//var DEFAULT_SECURITY_GROUP = 'sg-356bb652'; // Default SG allows all traffic

// NETWORK INTERFACE MUST HAVE MATCHING SECURITY GROUP
//var NETWORK_INTERFACE_ID = 'eni-66bd8349';

function getECSContainerInstanceUserData(clusterName, auth) {

  var data = ['#!/bin/bash',
             'echo ECS_CLUSTER=' + clusterName + ' >> /etc/ecs/ecs.config;'];

  if(auth) {

    console.log(auth);

    if(!auth.cfg && (!auth.username || !auth.password || !auth.email)) {
      throw 'Auth should contain a username, password, and email';
    }

    var authJson;
    var cfgType;

    if(auth.cfg) {
      authJson = JSON.parse(auth.cfg);
      cfgType = 'dockercfg';
    } else {
      authJson = {
        'https://index.docker.io/v1/user': auth
      };
      cfgType = 'docker';
    }


    var authStr = JSON.stringify(authJson);

    var authType = 'echo ECS_ENGINE_AUTH_TYPE=' + cfgType +
                   ' >> /etc/ecs/ecs.config;';
    var authData = 'echo ECS_ENGINE_AUTH_DATA=' + authStr +
                   ' >> /etc/ecs/ecs.config;';

    data.push(authType);
    data.push(authData);
  }

  var bash = data.join('\n');

  console.log('fuck');
  console.log(bash);

  var buf = new Buffer(bash);
  return buf.toString('base64');
}

var DEFAULT_INSTANCE_PARAMS = {
  ImageId: AMI_ID,
  MaxCount: 1,
  MinCount: 1,

  DisableApiTermination: false,

  IamInstanceProfile: {
    Name: 'ecsInstanceRole'
  },

  EbsOptimized: false,

  // XXX Should they terminate on shutdown?
  InstanceInitiatedShutdownBehavior: 'terminate',

  InstanceType: EC2_INSTANCE_TYPE,

  // XXX IF YOU WANT TO SSH INTO THIS BOX THIS HAS TO BE SUPPLIED
  //KeyName: 'STRING_VALUE',

  Monitoring: {
    // TODO investigate
    Enabled: true /* required */
  },

  NetworkInterfaces: [
    {
      DeviceIndex: 0,
      //NetworkInterfaceId: NETWORK_INTERFACE_ID,
      AssociatePublicIpAddress: true,
      SubnetId: 'SUBNET',
      DeleteOnTermination: true,
      Groups: ['SECURITY_GROUP']
    }
  ],

  Placement: {
    Tenancy: 'default'
  }

  // TODO INSTALL ECS AGENT HERE
  //UserData: 'STRING_VALUE'
};

function getEC2Manager(ec2) {

  /**
   * @param config Object
   * config will merge with default ec2 config
   */
  function buildEc2Box(config) {
    if(!config) {
      throw 'This function requires a configuration object';
    }

    var clusterName = config.clusterName;
    if(!config.clusterName) {
      throw 'Instance requires cluster name';
    }

    var auth = config.auth;
    var apiConfig = config.apiConfig;
    apiConfig.UserData = getECSContainerInstanceUserData(clusterName, auth);

    var params = R.merge(DEFAULT_INSTANCE_PARAMS, apiConfig);

    return Q.nbind(ec2.runInstances, ec2)(params);
  }


  /**
   *  @param instanceIds Array
   */
  function checkInstanceStatuses(instanceIds) {
    if(!instanceIds.length) {
      throw 'No instance IDs';
    }

    var params = {
      InstanceIds: instanceIds
    };

    return Q.nbind(ec2.describeInstances, ec2)(params);
  }


  return {
    createEC2Instance: buildEc2Box,
    checkInstanceStatus: checkInstanceStatuses
  };
}


module.exports = getEC2Manager;

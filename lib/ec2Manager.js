'use strict';

var Q = require('q');
var R = require('ramda');


var AMI_ID = 'ami-8da458e6'; // amzn-ami-2015.03.d-amazon-ecs-optimized
var EC2_INSTANCE_TYPE = 't2.micro';

//var DEFAULT_SECURITY_GROUP = 'sg-356bb652'; // Default SG allows all traffic

// NETWORK INTERFACE MUST HAVE MATCHING SECURITY GROUP
var NETWORK_INTERFACE_ID = 'eni-66bd8349';

var UNIQUE_CLIENT_TOKEN = 'def'; // XXX ENSURE IDEMPOTENCY, this needs to be different for every request


var DEFAULT_INSTANCE_PARAMS = {
  ImageId: AMI_ID,
  MaxCount: 1,
  MinCount: 1,

  // TODO see if this is the "name"
  AdditionalInfo: 'STRING_VALUE',

  ClientToken: UNIQUE_CLIENT_TOKEN,

  DisableApiTermination: false,

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
      NetworkInterfaceId: NETWORK_INTERFACE_ID,
    }
  ],

  Placement: {
    Tenancy: 'default'
  },

  // TODO INSTALL ECS AGENT HERE
  //UserData: 'STRING_VALUE'
};


function getEC2Manager(ec2) {


  /**
   * @param config Object
   * config will merge with default ec2 config
   */
  function buildEc2Box(config) {
    config = config || {};
    var params = R.merge(DEFAULT_INSTANCE_PARAMS, config);

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

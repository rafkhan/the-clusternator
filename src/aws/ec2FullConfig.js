/*
 * This is the whole commented out EC2 configuration object
 * that could possibly be relevant to us.
 *
 * TODO put the docs link...
 */

var AMI_ID = 'ami-8da458e6'; // amzn-ami-2015.03.d-amazon-ecs-optimized
var EC2_INSTANCE_TYPE = 't2.micro';

//var DEFAULT_SECURITY_GROUP = 'sg-356bb652'; // Default SG allows all traffic

// NETWORK INTERFACE MUST HAVE MATCHING SECURITY GROUP
var NETWORK_INTERFACE_ID = 'eni-66bd8349';

var UNIQUE_CLIENT_TOKEN = 'def'; // XXX ENSURE IDEMPOTENCY, this needs to be different for every request

var DEFAULT_INSTANCE_PARAMS = {
  ImageId: AMI_ID, /* required */
  MaxCount: 1, /* required */
  MinCount: 1, /* required */

  AdditionalInfo: 'STRING_VALUE',

  /*
  BlockDeviceMappings: [
    {
      DeviceName: '/dev/xvda',
      Ebs: {
        DeleteOnTermination: true,
        Encrypted: false,
        //Iops: 0,
        VolumeSize: 30,
        VolumeType: 'standard'
      }
      //NoDevice: 'STRING_VALUE',
    }
  ],
  */

  ClientToken: UNIQUE_CLIENT_TOKEN,

  DisableApiTermination: false,

  EbsOptimized: false,

  //IamInstanceProfile: {
    //Arn: 'arn:aws:iam::731670193630:user/superraf',
    //Name: 'superraf'
  //},

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

      /* SPECIFY WHEN CREATING NI
      AssociatePublicIpAddress: true,

      // XXX may want to set to true...?
      DeleteOnTermination: false,

      Description: 'STRING_VALUE',

      Groups: [
        'STRING_VALUE',
        /* more items
      ],
      */

      DeviceIndex: 0,

      NetworkInterfaceId: NETWORK_INTERFACE_ID,

      /*
      PrivateIpAddress: 'STRING_VALUE',
      PrivateIpAddresses: [
        {
          PrivateIpAddress: 'STRING_VALUE', /* required
          Primary: true || false
        },
        /* more items
      ],
      */

      //SecondaryPrivateIpAddressCount: 0,
      // SubnetId: 'STRING_VALUE' // SPECIFY WHEN CREATING NI
    }
  ],

  Placement: {
    //AvailabilityZone: AWS_REGION,
    //GroupName: 'STRING_VALUE',
    Tenancy: 'default'
  },

  //PrivateIpAddress: 'STRING_VALUE',

  //RamdiskId: 'STRING_VALUE',

  //SecurityGroupIds: [
    //DEFAULT_SECURITY_GROUP,
  //],

  //SubnetId: 'STRING_VALUE',

  // TODO INSTALL ECS AGENT HERE
  //UserData: 'STRING_VALUE'
};

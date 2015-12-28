const CLUSTERNATOR_PREFIX = 'clusternator',
 DELIM = '-',
 CLUSTERNATOR_TAG = CLUSTERNATOR_PREFIX + DELIM + 'created',
 PROJECT_TAG = CLUSTERNATOR_PREFIX + DELIM + 'project',
 PR_TAG = CLUSTERNATOR_PREFIX + DELIM + 'pr',
 DEPLOYMENT_TAG = CLUSTERNATOR_PREFIX + DELIM + 'deployment',
 SHA_TAG = CLUSTERNATOR_PREFIX + DELIM + 'sha',
/** NOTE EC2 AMI's are region specific */
// AWS_DEFAULT_EC2_AMI = 'ami-8da458e6',
 AWS_DEFAULT_EC2_AMI = 'ami-e2b1f988',
 AWS_DEFAULT_EC2_TYPE = 't2.micro',
 SSH_PUBLIC_PATH = 'ssh-public';


const constants = Object.freeze({
  DEFAULT_API_VERSION: '0.1',
  LOG_LEVELS: Object.freeze({
    0: 'error',
    1: 'warn',
    2: 'info',
    3: 'verbose',
    4: 'debug',
    5: 'silly'
  }),
  AWS_R53_ZONE_PREFIX: '/hostedzone/',
  AWS_DEFAULT_EC2_AMI,
  AWS_DEFAULT_EC2_TYPE,
  AWS_EC2_POLL_INTERVAL: 15000, // ms to wait between polling EC2 statuses
  AWS_EC2_POLL_MAX: 40, // times to retry EC2 polls (create/terminate)
  AWS_DEFAULT_CIDR: '10.0.0.0/24',
  AWS_DEFAULT_AZ: 'us-east-1a',
  AWS_FILTER_CTAG: [{
    Name: 'tag-key',
    Values: [
      CLUSTERNATOR_TAG
    ]
  }],
  CLUSTERNATOR_PREFIX,
  CLUSTERNATOR_TAG,
  PROJECT_TAG,
  PR_TAG,
  DEPLOYMENT_TAG,
  SHA_TAG,
  SSH_PUBLIC_PATH,
  AWS_DEFAULT_EC2: Object.freeze({
    ImageId: AWS_DEFAULT_EC2_AMI,
    MaxCount: 1,
    MinCount: 1,

    DisableApiTermination: false,

    IamInstanceProfile: {
      Name: 'ecsInstanceRole'
    },

    EbsOptimized: false,

    InstanceInitiatedShutdownBehavior: 'terminate',

    InstanceType: AWS_DEFAULT_EC2_TYPE,

    // XXX IF YOU WANT TO SSH INTO THIS BOX THIS HAS TO BE SUPPLIED
    // @todo maybe ssh for tail logging?
    // KeyName: 'STRING_VALUE',

    Monitoring: {
      // @todo investigate cloud watch
      Enabled: true /* required */
    },

    NetworkInterfaces: [
      // {
      //  DeviceIndex: 0,
      //  NetworkInterfaceId: NETWORK_INTERFACE_ID,
      //  AssociatePublicIpAddress: true,
      //  SubnetId: 'subnet-0b251420',
      //  DeleteOnTermination: true,
      //  Groups: ['sg-692ee50e']
      // }
    ],

    Placement: {
      Tenancy: 'default'
    }

    // TODO INSTALL ECS AGENT HERE
    //UserData: 'STRING_VALUE'
  })
});

module.exports = constants;

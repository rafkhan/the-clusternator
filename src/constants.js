const CLUSTERNATOR_PREFIX = 'clusternator';
const DELIM = '-';
const CLUSTERNATOR_TAG = CLUSTERNATOR_PREFIX + DELIM + 'created';
const PROJECT_TAG = CLUSTERNATOR_PREFIX + DELIM + 'project';
const PR_TAG = CLUSTERNATOR_PREFIX + DELIM + 'pr';
const AWS_DEFAULT_EC2_AMI = 'ami-8da458e6';
const AWS_DEFAULT_EC2_TYPE = 't2.micro';

var constants = Object.freeze({
  AWS_DEFAULT_EC2_AMI: AWS_DEFAULT_EC2_AMI,
  AWS_DEFAULT_EC2_TYPE: AWS_DEFAULT_EC2_TYPE,
  AWS_DEFAULT_CIDR: '10.0.0.0/24',
  AWS_DEFAULT_AZ: 'us-east-1a',
  AWS_FILTER_CTAG: [
    {
      Name: 'tag-key',
      Values: [
        CLUSTERNATOR_TAG
      ]
    }
  ],
  CLUSTERNATOR_PREFIX: CLUSTERNATOR_PREFIX,
  CLUSTERNATOR_TAG: CLUSTERNATOR_TAG,
  PROJECT_TAG: PROJECT_TAG,
  PR_TAG: PR_TAG,
  AWS_DEFAULT_ACL_INGRESS: {
    NetworkAclId: '',
    RuleNumber: 1,
    Protocol: '-1',
    RuleAction: 'allow',
    Egress: false,
    CidrBlock: '0.0.0.0/0',
    PortRange: {
      From: 0,
      To: 0
    }
  },
  AWS_DEFAULT_ACL_EGRESS: {
    NetworkAclId: '',
    RuleNumber: 1,
    Protocol: '-1',
    RuleAction: 'allow',
    Egress: true,
    CidrBlock: '0.0.0.0/0',
    PortRange: {
      From: 0,
      To: 0
    }
  },
  AWS_DEFAULT_SG_INGRESS: {
    GroupId: '',
    IpPermissions: [
      {
        FromPort: 1,
        ToPort: 65535,
        IpProtocol: '-1',
        IpRanges: [
          {
            CidrIp: '0.0.0.0/0'
          }
        ]
      }
    ]
  },
  AWS_DEFAULT_SG_EGRESS: {
    GroupId: '',
    IpPermissions: [
      {
        FromPort: 0,
        ToPort: 65535,
        IpProtocol: '-1',
        IpRanges: [
          {
            CidrIp: '0.0.0.0/0'
          }
        ]
      }
    ]
  },
  AWS_DEFAULT_EC2: {
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
  }
});

module.exports = constants;

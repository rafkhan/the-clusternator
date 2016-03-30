const AWS_DEFAULT_EC2_AMI = 'ami-e7acf78d';
const AWS_DEFAULT_EC2_TYPE = 't2.micro';

/**
 * Prototypes for assembling AWS ec2 entities
 *
 * @module aws/ec2Skeletons
 */
module.exports = Object.freeze({
  SECURITY_GROUP: {
    GroupName: '',
    Description: '',
    VpcId: ''
  },
  VPC: {
    CidrBlock: ''
  },
  EBS: {
    AvailabilityZone: '',
    size: '20' // GB
  },
  EBS_ATTACH: {
    Device: 'xvdo',
    InstanceId: '',
    VolumeId: ''
  },
  ACL: {
      VpcId: ''
  },
  ACL_DEFAULT_INGRESS: {
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
  ACL_DEFAULT_EGRESS: {
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
  SG_DEFAULT_INGRESS: {
    GroupId: '',
    IpPermissions: [{
      FromPort: 1,
      ToPort: 65535,
      IpProtocol: '-1',
      IpRanges: [{
        CidrIp: '0.0.0.0/0'
      }]
    }]
  },
  SG_DEFAULT_EGRESS: {
    GroupId: '',
    IpPermissions: [{
      FromPort: 1,
      ToPort: 65535,
      IpProtocol: '-1',
      IpRanges: [{
        CidrIp: '0.0.0.0/0'
      }]
    }]
  }
});

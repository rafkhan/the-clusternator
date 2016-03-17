/**
 * Prototypes for dealing with AWS's route53
 *
 * @module aws/route53Skeletons
 */
module.exports = Object.freeze({
  RECORD_TYPES: [
    'SOA', 'A', 'TXT', 'NS', 'CNAME', 'MX', 'PTR', 'SRV', 'SPF', 'AAAA'
  ],
  CHANGE_ACTIONS: [
    'CREATE', 'DELETE', 'UPSERT'
  ],
  RESOURCE_RECORD: {
    Value: ''
  },
  ALIAS_RECORD: {
    DNSName: '',
    EvaluateTargetHealth: true,
    HostedZoneId: ''
  },
  RESOURCE_RECORD_SET: {
    'Name': '', // Subdomain Name
    'Type': '', // SOA | A | TXT | NS | CNAME | MX | PTR | SRV | SPF | AAAA
    'TTL': 30,
    'ResourceRecords': []
  },
  ALIAS_TARGET: {
    'HostedZoneId': '',
    'DNSName': '',
    'EvaluateTargetHealth': true
  },
  CHANGE: {
    'Action': '', // CREATE | DELETE | UPSERT
  },
  CHANGE_BATCH: {
    'Comment': 'Clusternator Created',
    'Changes': []
  },
  CHANGE_PARAMS: {
    'HostedZoneId': ''
  },
  HOSTED_ZONE: {
    CallerReference: 'clusternator',
    Name: ''
  }
});

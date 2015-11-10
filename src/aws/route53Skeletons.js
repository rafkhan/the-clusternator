module.exports = Object.freeze({
  RESOURCE_RECORD: {
    Value: ''
  },
  RESOURCE_RECORD_SET: {
    'Name': '', // Subdomain Name
    'Type': '', // SOA | A | TXT | NS | CNAME | MX | PTR | SRV | SPF | AAAA
    'TTL': 300,
    'ResourceRecords': [{
      'Value': ''
    }],
    'HealthCheckId': ''
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
  }
});

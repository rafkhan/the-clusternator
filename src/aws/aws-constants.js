'use strict';

const util = require('../util');
const constants = require('../constants');

const EXPORTS = {
  AWS_APIS: {
    dynamodb: '2012-08-10',
    ec2: '2015-10-01',
    ecr: '2015-09-21',
    ecs: '2014-11-13',
    iam: '2010-05-08',
    route53: '2013-04-01'
  },
  AWS_DEFAULT_AZ: 'us-east-1a',
  AWS_EC2_POLL_INTERVAL: 15000, // ms to wait between polling EC2 statuses
  AWS_EC2_POLL_MAX: 40, // times to retry EC2 polls (create/terminate)
  AWS_FILTER_CTAG: [{
    Name: 'tag-key',
    Values: [
      constants.CLUSTERNATOR_TAG
    ]
  }],
  AWS_R53_ZONE_PREFIX: '/hostedzone/',
  AWS_SSL_ID:
    'arn:aws:iam::731670193630:server-certificate/clusternator-wildcard',

};

module.exports = util.deepFreeze(EXPORTS);
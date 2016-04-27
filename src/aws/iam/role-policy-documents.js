'use strict';

const ec2TrustPolicy = {
  'Version': '2008-10-17',
  'Statement': [
    {
      'Sid': '',
      'Effect': 'Allow',
      'Principal': {
        'Service': 'ec2.amazonaws.com'
      },
      'Action': 'sts:AssumeRole'
    }
  ]
};

const ec2EcsPolicy = {
  'Version': '2012-10-17',
  'Statement': [
    {
      'Effect': 'Allow',
      'Action': [
        'ecs:CreateCluster',
        'ecs:DeregisterContainerInstance',
        'ecs:DiscoverPollEndpoint',
        'ecs:Poll',
        'ecs:RegisterContainerInstance',
        'ecs:StartTelemetrySession',
        'ecs:Submit*',
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage'
      ],
      'Resource': '*'
    }
  ]
};

module.exports = {
  ec2TrustPolicy,
  ec2EcsPolicy
};

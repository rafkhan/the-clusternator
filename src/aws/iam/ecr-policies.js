'use strict';

module.exports = {
  user,
  general
};

/**
 * @reutrns {string}
 */
function general() {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'ecr:GetAuthorizationToken',
          'ecr:GetManifest'
        ],
        Resource: '*'
      }
    ]
  });
}
/**
 * @param {string} registryArn
 * @returns {string}
 * @throws {TyoeError}
 */
function user(registryArn) {
  if (!registryArn) {
    throw new TypeError('ecrUser expects a registryArn');
  }
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
    {
      Effect: 'Allow',
      Action: [
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:GetRepositoryPolicy',
        'ecr:DescribeRepositories',
        'ecr:ListImages',
        'ecr:BatchGetImage',
        'ecr:InitiateLayerUpload',
        'ecr:UploadLayerPart',
        'ecr:CompleteLayerUpload',
        'ecr:PutImage'
      ],
      Resource: registryArn
    }
  ]
  });
}

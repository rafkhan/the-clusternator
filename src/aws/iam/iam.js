'use strict';

const constants = require('../../constants');
const common = require('../common');

module.exports = {
  listServerCertificates,    // filtered for clusternator
  listAllServerCertificates, // _everything_ (analogue to aws.iam.listServer...)
  deleteServerCertificate,
  uploadServerCertificate,
  createUser,
  destroyUser,
  createPolicy,
  destroyPolicy,
  attachPolicy,
  listUsers
};

/**
 * @param {AwsWrapper} aws
 * @param {string} policyArn
 * @param {string} userName
 * @returns {Q.Promise}
 */
function attachPolicy(aws, policyArn, userName) {
  return aws.iam.attachPolicy({
    PolicyArn: policyArn,
    UserName: userName
  });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @param {string} policy
 * @param {string} description
 * @returns {Q.Promise}
 */
function createPolicy(aws, name, policy, description) {
  name = common.clusternatePrefixString(name);
  description = description || 'Clusternator Policy';
  return aws.iam.createPolicy({
    PolicyName: name,
    PolicyDocument: policy,
    Description: description
  });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} arn
 * @returns {Q.Promise}
 */
function destroyPolicy(aws, arn) {
  return aws.iam.deletePolicy({
    PolicyArn: arn
  });
}


/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise}
 */
function createUser(aws, name) {
  name = common.clusternatePrefixString(name);
  return aws.iam.createUser({
    UserName: name
  });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise}
 */
function destroyUser(aws, name) {
  name = common.clusternatePrefixString(name);
  return aws.iam.deleteUser({
    UserName: name
  });
}

/**
 * @param {AwsWrapper} aws
 * @returns {Q.Promise}
 */
function listUsers(aws) {
  return aws.iam
    .listUsers()
    .then((results) => results
      .Users.filter((user) => user
        .UserName.indexOf(constants.CLUSTERNATOR_PREFIX) === 0));
}

/**
 * @param {AwsWrapper} aws
 * @param {string} certificate
 * @param {string} privateKey
 * @param {string=} chain
 * @param {string=} certId
 * @returns {Q.Promise}
 */
function uploadServerCertificate(aws, certificate, privateKey, chain, certId) {
  if (!certificate || !privateKey) {
    throw new TypeError('uploadSererCertificate expects cert, and private key');
  }
  certId = certId ||
    `${constants.CLUSTERNATOR_PREFIX}-${(+Date.now()).toString(16)}`;
  chain = chain || '';
  certId = common.clusternatePrefixString(certId);
  return aws.iam.uploadServerCertificate({
    CertificateBody: certificate,
    PrivateKey: privateKey,
    CertificateChain: chain,
    ServerCertificateName: certId
  });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} certId
 * @returns {Q.Promise}
 * @throws {TypeError}
 */
function deleteServerCertificate(aws, certId) {
  if (!certId) {
    throw new TypeError('deleteServerCertificate requires a certId');
  }
  return aws.iam.deleteServerCertificate({ ServerCertificateName: certId });
}

/**
 * @param {{ ServerCertificateName: string }} item
 * @returns {boolean}
 */
function filterClusternatorTag(item) {
  return item
      .ServerCertificateName.indexOf(constants.CLUSTERNATOR_PREFIX) === 0;
}

/**
 * @param {{ ServerCertificateName: string, ServerCertificateId: string,
 Arn: string}} item
 * @returns {{certId: (string|*), awsId: *, arn: *}}
 */
function mapCertificateToSimple(item) {
  return {
    certId: item.ServerCertificateName,
    awsId: item.ServerCertificateId,
    arn: item.Arn
  };
}

/**
 * @param {AwsWrapper} aws
 * @returns {Q.Promise}
 */
function listAllServerCertificates(aws) {
  return aws.iam
    .listServerCertificates()
    .then((results) => results
      .ServerCertificateMetadataList
      .map(mapCertificateToSimple));
}

/**
 * @param {AwsWrapper} aws
 * @returns {Q.Promise}
 */
function listServerCertificates(aws) {
  return aws.iam
    .listServerCertificates()
    .then((results) => results
      .ServerCertificateMetadataList
      .filter(filterClusternatorTag)
      .map(mapCertificateToSimple));
}

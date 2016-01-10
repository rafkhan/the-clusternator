'use strict';

const Q = require('q');
const policies = { ecr: require('./ecr-policies') }
const constants = require('../../constants');
const common = require('../common');
const rid = require('../../resourceIdentifier');

module.exports = {
  listServerCertificates,    // filtered for clusternator
  listAllServerCertificates, // _everything_ (analogue to aws.iam.listServer...)
  deleteServerCertificate,
  uploadServerCertificate,
  createUser,
  destroyUser,
  createPolicy,
  createEcrUserPolicy,
  destroyPolicy,
  attachPolicy,
  describeUsers,
  describeUser,
  describePolicy,
  describePolicies,
  policyArn,
  describeAccessKeys,
  createAccessKey,
  destroyAccessKeys,
  describeAccessKey
};

function describeAccessKey(aws, name) {
  return describeAccessKeys(aws, name)
    .then((result) => {
      if (result[0]) {
        return result[0];
      }
      throw new Error(`IAM: describeAccessKey: ${name} not found`);
    });
}

/**
 * @param aws
 * @param name
 * @returns {Q.Promise<Object>}
 */
function describeAccessKeys(aws, name) {
  name = rid.clusternatePrefixString(name);
  return aws.iam.listAccessKeys({
      UserName: name})
    .then((desc) => {
      const result = desc.AccessKeyMetadata;
      if (result.length) {
        return result;
      }
      throw new Error(`IAM: No keys found for [name] `);
    });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise<Object>}
 * @throws {TypeError}
 */
function createAccessKey(aws, name) {
  if (!name) {
    throw new TypeError('IAM: createAccessKey requires user name');
  }
  name = rid.clusternatePrefixString(name);
  return describeAccessKeys(aws, name)
    .then((results) => results[0])
    .fail(() => aws.iam.createAccessKey({
      UserName: name })
      .then((result) => result.AccessKey));
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise}
 * @throws {TypeError}
 */
function destroyAccessKeys(aws, name) {
  if (!name) {
    throw new TypeError('IAM: createAccessKey requires a name');
  }
  name = rid.clusternatePrefixString(name);
  return describeAccessKeys(aws, name)
  .then((keys) => Q
    .all(keys.map((kDesc) => aws.iam
      .deleteAccessKey({
        UserName: name,
        AccessKeyId:  kDesc.AccessKeyId}))));
}

/**
 * @param {AwsWrapper} aws
 * @param {string} policyArn
 * @param {string} userName
 * @returns {Q.Promise}
 * @throws {TypeError}
 */
function attachPolicy(aws, policyArn, userName) {
  if (!userName || !policyArn) {
    throw new TypeError('IAM: attachPolicy requires policyArn, and userName');
  }
  userName = rid.clusternatePrefixString(userName);
  return aws.iam.attachUserPolicy({
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
  if (!name || !policy) {
    throw new TypeError('IAM: createUser requires a name, and policy document');
  }
  name = rid.clusternatePrefixString(name);
  description = description || 'Clusternator Policy';
  return aws.iam.createPolicy({
      PolicyName: name,
      PolicyDocument: policy,
      Description: description})
    .fail((err) => describePolicy(aws, name));
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @param {string} policy
 * @param {string} description
 * @returns {Q.Promise}
 */
function createEcrUserPolicy(aws, name, regisryArn, description) {
  return createPolicy(aws, name, policies.ecr.user(regisryArn), description);
}

/**
 * @param {AwsWrapper} aws
 * @param {string} arn
 * @returns {Q.Promise}
 * @throws {TypeError}
 */
function destroyPolicy(aws, arn) {
  if (!arn) {
    throw new TypeError('IAM: destroy policy requires arn');
  }
  return aws.iam
    .deletePolicy({
      PolicyArn: arn })
    .fail((err) => describePolicy(aws, arn)
      // if the policy doesn't exist, that's fine with us
      .then(() => { throw err; }, () => null));
}


/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise}
 * @throws {TypeError}
 */
function createUser(aws, name) {
  if (!name) {
    throw new TypeError('IAM: createUser requires name');
  }
  name = rid.clusternatePrefixString(name);
  return aws.iam.createUser({
    UserName: name
  }).fail(() => describeUser(aws, name));
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise}
 * @throws {TypeError}
 */
function destroyUser(aws, name) {
  if (!name) {
    throw new TypeError('IAM: createUser requires name');
  }
  name = rid.clusternatePrefixString(name);
  return aws.iam.deleteUser({
      UserName: name })
    .fail((err) => describeUser(aws, name)
       // if the user doesn't exist, we don't care
      .then(() => { throw err; }, () => null));
}

/**
 * @param {AwsWrapper} aws
 * @returns {Q.Promise<Object[]>}
 */
function describePolicies(aws) {
  return aws.iam
    .listPolicies()
    .then((results) => results
      .Policies.filter((policy) => rid
        .isPrefixed(policy.PolicyName)));
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise<Object>}
 * @throws {TypeError}
 */
function describePolicy(aws, name) {
  if (!name) {
    throw new TypeError('IAM: describePolicy requires a name');
  }
  return describePolicies(aws)
    .then((policies) => {
      const result = filterByName(policies, 'PolicyName', rid
        .clusternatePrefixString(name));
      if (result[0]) {
        return result[0];
      }
      throw new Error(`IAM: Policy ${name} not found`);
    });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise<string>}
 */
function policyArn(aws, name) {
  return describePolicy(aws, name)
    .then((desc) => desc.Arn);
}

/**
 * @param {AwsWrapper} aws
 * @returns {Q.Promise<Object[]>}
 */
function describeUsers(aws) {
  return aws.iam
    .listUsers()
    .then((results) => results
      .Users.filter((user) => rid
        .isPrefixed(user.UserName)));
}

/**
 * @param {Array} coll
 * @param {string} attr
 * @param {string} name
 * @returns {*}
 */
function filterByName(coll, attr, name) {
  return coll.filter((item) => item[attr] === name );
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @returns {Q.Promise<Object>}
 * @throws {TypeError}
 */
function describeUser(aws, name) {
  if (!name) {
    throw new TypeError('IAM: describeUser requires a name');
  }
  return describeUsers(aws)
    .then((users) => {
     const result = filterByName(users, 'UserName', rid
        .clusternatePrefixString(name));
      if (result[0]) {
        return result[0];
      }
      throw new Error(`IAM: describeUser: ${name} not found`);
    });
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
  certId = rid.clusternatePrefixString(certId);
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
  return rid.isPrefixed(item.ServerCertificateName);
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

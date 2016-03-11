'use strict';
/**
 * Types for managing AWS EC2 SecurityGroups
 *
 * @module aws/ec2/sg/groups
 */

const filter = require('./ec2-filter');
const tag = require('./ec2-tag');
const constants = require('../../constants');
const rid = require('../../resource-identifier');
const util = require('../../util');

const ipPerms = require('./security-groups-ip-permissions');
const ipRange = require('./security-group-ip-range');

module.exports = {
  bindAws,
  create,
  createDeployment,
  createPr,
  describe,
  describeDeployment,
  describePr,
  describeProject,
  destroy,
  destroyDeployment,
  destroyPr,
  list,
  listDeployment,
  listPr,
  listProject,
  authorizeEgress,
  authorizeIngress,
  helpers: {
    getDeploymentTags,
    getPrTags
  }
};

/**
 * @param {AwsWrapper} aws
 * @returns {Object} this API bound to
 */
function bindAws(aws) {
  const securityGroups = {};
  Object.keys(module.exports).forEach((fnName) => {
    if (typeof module.exports[fnName] === 'function') {
      securityGroups[fnName] = util.partial(module.exports[fnName], [ aws ]);
    }
  });
  return securityGroups;
}


/**
 * @param {AwsWrapper} aws
 * @param {string} groupId
 * @param {SgIpPermissions[]} ipPermissions
 * @returns {Q.Promise}
 * @throws {TypeError}
 */
function authorizeIngress(aws, groupId, ipPermissions) {
  if (!Array.isArray(ipPermissions)) {
    throw new TypeError('authorizeIngress requires array of IP permissions');
  }

  return aws.ec2.authorizeSecurityGroupIngress({
    GroupId: groupId,
    IpPermissions: ipPermissions
  });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} groupId
 * @param {SgIpPermissions[]} ipPermissions
 * @returns {Q.Promise}
 * @throws {TypeError}
 */
function authorizeEgress(aws, groupId, ipPermissions) {
  if (!Array.isArray(ipPermissions)) {
    throw new TypeError('authorizeEgress requires array of IP permissions');
  }
  return aws.ec2.authorizeSecurityGroupEgress({
    GroupId: groupId,
    IpPermissions: ipPermissions
  });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} name
 * @param {string} description
 * @returns {Q.Promise<string>}
 */
function create(aws, name, description) {
  return aws.ec2
    .createSecurityGroup({
      GroupName: name,
      Description: description,
      VpcId: aws.vpcId })
    .then((result) => result.GroupId);
}

/**
 * @param {string} projectId
 * @param {string} pr
 * @returns {Array.<Ec2Tag>}
 */
function getPrTags(projectId, pr) {
  return [
    tag.createClusternator(),
    tag.createProject(projectId),
    tag.createPr(pr)
  ];
}

/**
 * @param {string} projectId
 * @param {string} pr
 * @return {string}
 */
function createPrName(projectId, pr) {
  return rid.generateRID({
    pid: projectId,
    pr: pr
  });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @param {string} pr
 * @returns {Q.Promise<string>}
 */
function createPr(aws, projectId, pr) {
  const id = createPrName(projectId, pr);

  return listPr(aws, projectId, pr)
    .then((r) => r.length ? r[0] : create(
      aws, id, `Created by The Clusternator For ${projectId} PR #${pr}`)
      .then((id) => tag
        .tag(aws, [id], getPrTags(projectId, pr))()
        .then(authorizeIngress(aws, id, [
          ipPerms.create(-1, 1, 65534, [ipRange.create('0.0.0.0/0')])
        ]))
        .then(() => id)));
}

/**
 * @param {string} projectId
 * @param {string} deployment
 * @returns {Array.<Ec2Tag>}
 */
function getDeploymentTags(projectId, deployment) {
  return [
    tag.createClusternator(),
    tag.createProject(projectId),
    tag.createDeployment(deployment)
  ];
}

/**
 * @param {string} projectId
 * @param {string} deployment
 * @returns {string}
 */
function createDeploymentName(projectId, deployment) {
  return rid.generateRID({
    pid: projectId,
    deployment: deployment
  });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @param {string} deployment
 * @returns {Q.Promise<string>}
 */
function createDeployment(aws, projectId, deployment) {
  const id = createDeploymentName(projectId, deployment);
  return listDeployment(aws, projectId, deployment)
    .then((r) => r.length ? r[0] : create(
      aws, id, `Created by The Clusternator For ${projectId} deployment ` +
      deployment)
      .then((id) => tag
        .tag(aws, [id], getDeploymentTags(projectId, deployment))()
        .then(authorizeIngress(aws, id, [
          ipPerms.create(-1, 1, 65534, [ipRange.create('0.0.0.0/0')])
        ]))
        .then(() => id)));
}

/**
 * @param {AwsWrapper} aws
 * @param {string} groupId
 * @returns {Promise.<string>}
 */
function destroy(aws, groupId) {
  return aws.ec2.deleteSecurityGroup({
    GroupId: groupId
  }).then(() => 'deleted');
}

/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @param {string} deployment
 * @returns {Promise.<string>}
 */
function destroyDeployment(aws, projectId, deployment) {
  return listDeployment(aws, projectId, deployment)
    .then((r) => r.length ? destroy(aws, r[0]) : 'already deleted');
}

/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @param {string} pr
 * @returns {Promise.<string>}
 */
function destroyPr(aws, projectId, pr) {
  return listPr(aws, projectId, pr)
    .then((r) => r.length ? destroy(aws, r[0]) : 'already deleted');
}

/**
 * @param {AwsWrapper} aws
 * @returns {Promise}
 */
function describe(aws) {
  return aws.ec2.describeSecurityGroups({
    Filters: [
      filter.createVpc(aws.vpcId),
      filter.createClusternator()
    ]
  });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @returns {Q.Promise}
 */
function describeProject(aws, projectId) {
  return aws.ec2.describeSecurityGroups({
    Filters: [
      filter.createVpc(aws.vpcId),
      filter.createClusternator(),
      filter.createTag(constants.PROJECT_TAG, projectId)
    ]
  });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @param {string} pr
 * @returns {Q.Promise}
 */
function describePr(aws, projectId, pr) {
  return aws.ec2.describeSecurityGroups({
    Filters: [
      filter.createSgName(createPrName(projectId, pr))
    ]
  });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @param {string} deployment
 * @returns {Q.Promise}
 */
function describeDeployment(aws, projectId, deployment) {
  return aws.ec2.describeSecurityGroups({
    Filters: [
      filter.createSgName(createDeploymentName(projectId, deployment))
    ]
  });
}

/**
 * @param {Object} el
 * @returns {string}
 */
function mapDescription(el) {
  return el.GroupId;
}

/**
 * @param {Array} descriptions
 * @returns {Array}
 */
function mapDescribeToGroupIds(descriptions) {
  return descriptions.map(mapDescription);
}

/**
 * @param {AwsWrapper} aws
 * @returns {Q.Promise<string[]>}
 */
function list(aws) {
  return describe(aws)
    .then((result) => mapDescribeToGroupIds(result.SecurityGroups));
}

/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @returns {Q.Promise<string[]>}
 */
function listProject(aws, projectId) {
  return describeProject(aws, projectId)
    .then((result) => mapDescribeToGroupIds(result.SecurityGroups));
}

/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @param {string} pr
 * @returns {Q.Promise<string[]>}
 */
function listPr(aws, projectId, pr) {
  return describePr(aws, projectId, pr)
    .then((result) => mapDescribeToGroupIds(result.SecurityGroups));
}

/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @param {string} deployment
 * @returns {Q.Promise<string[]>}
 */
function listDeployment(aws, projectId, deployment) {
  return describeDeployment(aws, projectId, deployment)
    .then((result) => mapDescribeToGroupIds(result.SecurityGroups));
}

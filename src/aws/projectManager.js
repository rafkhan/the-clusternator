'use strict';

const Subnet = require('./subnetManager');
const ecrWrap = require('./ecr/ecr');
const iamWrap = require('./iam/iam');
const Route = require('./routeTableManager');
const Route53 = require('./route53Manager');
const Acl = require('./aclManager');
const Cluster = require('./clusterManager');
const Pr = require('./prManager');
const Ec2 = require('./ec2Manager');
const Deployment = require('./deploymentManager');
const DynamoManager = require('./dynamoManager');
const gpg = require('../cli-wrappers/gpg');
const constants = require('../constants');
const util = require('../util');
const Q = require('q');
const R = require('ramda');
const DEFAULT_REGION = 'us-east-1';

var Vpc = require('./vpcManager');

function getProjectManager(ec2, ecs, awsRoute53, dynamoDB, awsIam, awsEcr,
                           elb) {

  const cluster = Cluster(ecs);
  const vpc = Vpc(ec2);
  const r53 = Route53(awsRoute53);
  const ddbManager = DynamoManager(dynamoDB);

  const iam = R.mapObjIndexed(iamAwsPartial, iamWrap);
  const ecr = R.mapObjIndexed(ecrAwsPartial, ecrWrap);

  const STATE = {
    vpcId: null,
    zoneId: null,
    route: null,
    subnet: null,
    pullRequest: null,
    deployment: null,
    acl: null,
    ec2Mgr: null
  };


  function state() {
    if (!STATE.vpcId || !STATE.zoneId) {
      return initState();
    }
    return Q.resolve(STATE);
  }

  function ecrAwsPartial(fn) {
    return R.partial(fn, { ecr: util.makePromiseApi(awsEcr) });
  }
  function iamAwsPartial(fn) {
    return R.partial(fn, { iam: util.makePromiseApi(awsIam) });
  }

  /**
   * @param projectId
   * @returns {Q.Promise}
   */
  function destroy(projectId) {
    return state()
      .then((s) => ec2.describeProject(projectId)
        .then((list) => {
          if (list.length) {
            throw new Error('ProjectManager: Cannot destroy project while ' +
              'open pull requests exist');
          }
          return s
            .subnet.destroy(projectId)
            .then(() => s.acl.destroy(projectId));
        }));
  }

  /**
   * @param {string} projectId
   * @returns {Request|Promise.<T>}
   */
  function create(projectId) {
    return state()
      .then((s) => Q
        .all([
          s.route.findDefault(),
          s.acl.create(projectId),
          ecr.create(projectId) ])
        .then((results) => {
          const routeId = results[0].RouteTableId;
          const aclId = results[1].NetworkAcl.NetworkAclId;
          const repoArn = results[2].repositoryArn;

          return Q
            .all([
              s.subnet.create(projectId, routeId, aclId),
              iam.createProjectUser(projectId, repoArn)])
            .then((r) => {
              return {
                credentials:  r[1],
                aws: {
                  vpcId: s.vpcId,
                  registryId: results[2].registryId,
                  region: DEFAULT_REGION
                }
              };
            });
        }));
  }

  /**
   * @param {string} projectId
   * @returns {Request}
   */
  function findOrCreateProject(projectId) {
    return state()
      .then((s) => create(projectId)
        .then((sDesc) => sDesc, () => s.subnet.findProject()));
  }

  /**
   * @param {string} projectId
   * @param {string} pr
   * @param {Object} appDef
   * @param {Object=} sshData
   * @returns {Q.Promise}
   */
  function createPR(projectId, pr, appDef, sshData) {
    return state().then((s) => s
      .findOrCreateProject(projectId)
      .then((snDesc) => {
        return s.pullRequest
          .create(projectId, pr, appDef, sshData);
      }));
  }

  /**
   * @param {string} pid
   * @param {string} pr
   * @returns {Q.Promise}
   */
  function destroyPR(pid, pr) {
    return state()
      .then((s) => s
      .pullRequest.destroy(pid, pr));
  }

  /**
   * @param {string} projectId
   * @param {string} dep
   * @param {string} sha
   * @param {Object} appDef
   * @returns {Q.Promise}
   */
  function createDeployment(projectId, dep, sha, appDef) {
    console.log('sha', sha);
    return state()
      .then((s) => findOrCreateProject(projectId)
      .then((snDesc) => s
        .deployment.create(projectId, dep, sha, appDef )));
  }

  /**
   * @param {string} projectId
   * @param {string} dep
   * @param {string} sha
   * @returns {Q.Promise}
   */
  function destroyDeployment(projectId, dep, sha) {
    return state()
      .then((s) => findOrCreateProject(projectId)
        .then((snDesc) => s
          .deployment.destroy( projectId, dep, sha)));
  }

  /**
   * @param {string} projectId
   * @returns {Q.Promise}
   */
  function describeProject(projectId) {
    return cluster.describeProject(projectId);
  }


  /**
   * @param {string} projectId
   * @returns {Q.Promise}
   */
  function writeGitHubKey(projectId, token) {
    var item = {
      ProjectName: { S: projectId },
      GithubSecretToken: { S: token }
    };

    return ddbManager
      .insertItem(ddbManager.tableNames.GITHUB_AUTH_TOKEN_TABLE, item);
  }

  function listProjects() {
    return state()
      .then((s) => s
        .subnet.describe()
        .then((dBlock) => dBlock
          .map((block) => block.Tags ))
        .then((tags) => tags
          .map((tagGroup) => tagGroup
            .reduce((prev, curr) => {
              if (curr.Key === constants.PROJECT_TAG) {
                return curr.Value;
              }
            }, null) ).filter((identity) => {
            return identity;
          })));
  }

  /**
   * @param {string} projectId
   * @param {string} deploymentName
   * @param {string} sha
   * @param {Object} appDef
   * @returns {Q.Promise}
   */
  function updateDeployment(projectId, deploymentName, sha, appDef) {
    // call deployment manager
    return state()
      .then((s) => findOrCreateProject(projectId)
        .then((snDesc) => s
          .deployment.update(projectId, deploymentName, sha, appDef)));
  }

  function mapEc2ProjectDetails(instance) {
    var result = {
      type: 'type',
      identifier: '?',
      str: '',
      ip: '',
      state: ''
    }, inst, tags;

    if (!instance.Instances.length) {
      return result;
    }
    inst = instance.Instances[0];
    tags = inst.Tags;
    result.ip = inst.PublicIpAddress;
    result.state = inst.State.Name;

    tags.forEach((tag) => {
      if (tag.Key === constants.PR_TAG) {
        result.type = 'PR';
        result.identifier = tag.Value;
      }
      if (tag.Key === constants.DEPLOYMENT_TAG) {
        result.type = 'Deployment';
        result.identifier = tag.Value;
      }
    });

    result.str = `${result.type} ${result.identifier} ` +
      `(${result.ip}/${result.state})`;

    return result;
  }

  /**
   * @param {string} projectId
   * @returns {Q.Promise<string[]>}
   */
  function listSSHAbleInstances(projectId) {
    return state()
      .then((s) => s
        .ec2mgr.describeProject(projectId)
        .then((instances) => instances
          .map(mapEc2ProjectDetails)));
  }

  function initState() {
    return Q.all([
      vpc.findProject(),
      r53.findId()
    ]).then((results) => {
      const state = STATE;

      state.vpcId = results[0].VpcId;
      state.zoneId = results[1];
      state.route = Route(ec2, state.vpcId);
      state.subnet = Subnet(ec2, state.vpcId);
      state.acl = Acl(ec2, state.vpcId);
      state.ec2mgr = Ec2(ec2, state.vpcId);
      state.pullRequest = Pr(ec2, ecs, awsRoute53, elb, state.vpcId,
        state.zoneId);
      state.deployment = Deployment(ec2, ecs, awsRoute53, elb, state.vpcId,
        state.zoneId);

      return STATE;
    });
  }

  return {
    create,
    createPR,
    createDeployment,
    destroy,
    destroyPR,
    destroyDeployment,
    describeProject,
    listProjects,
    listSSHAbleInstances,
    updateDeployment,
    iam,
    ddbManager,
    writeGitHubKey
  };
}

module.exports = getProjectManager;

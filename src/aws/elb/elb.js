'use strict';

const R = require('ramda');
const constants = require('../../constants');
const tag = require('./elb-tag.js');
const pListeners = require('./port-listener');
const TCP = 'TCP';
const SSL = 'SSL';
const RX_ALPHA_NUM = /[^a-z0-9]/gi;

module.exports = {
  create,
  createDeployment,
  createPr,
  destroy,
  destroyDeployment,
  destroyPr,
  describe,
  describeDeployment,
  describePr,
  describeAll,
  configureHealthCheck,
  registerInstances,
  helpers: {
    filterClusternatorTags
  }
};

/**
 * @param {AwsWrapper} aws
 * @param {string} loadBalancerId
 * @param {number=} healthyThresh
 * @param {number=} unhealthyThresh
 * @param {string=} target
 * @param {number=} timeout
 * @param {number=} interval
 * @returns {*}
 */
function configureHealthCheck(aws, loadBalancerId, healthyThresh,
                              unhealthyThresh, target, timeout, interval) {
  /** @todo constant these defaults */
  target = target || 'HTTP:80/favicon.ico';
  interval = interval || 60;
  timeout = timeout || interval - 10;
  unhealthyThresh = unhealthyThresh || 5;
  healthyThresh = healthyThresh || 2;
  return aws.elb.configureHealthCheck({
    LoadBalancerName: loadBalancerId,
    HealthCheck: {
      HealthyThreshold: healthyThresh,
      Interval: interval,
      Target: target,
      Timeout: timeout,
      UnhealthyThreshold: unhealthyThresh
    }
  });
}

/**
 * ELB ids have to be < 32 characters, so our resourceIds are no good
 * @param {string} projectId
 * @param {string} deployment
 * @returns {string}
 */
function elbDeploymentId(projectId, deployment) {
  projectId = projectId.replace(RX_ALPHA_NUM, '');
  deployment = deployment.replace(RX_ALPHA_NUM, '');
  const id = `${projectId}-${deployment}`;
  if (id.length > 31) {
    return id.slice(0, 31);
  }
  return id;
}

/**
 * ELB ids have to be < 32 characters, so our resourceIds are no good
 * @param {string} projectId
 * @param {string} pr
 * @returns {string}
 */
function elbPrId(projectId, pr) {
  projectId = projectId.replace(RX_ALPHA_NUM, '');
  pr = pr.replace(RX_ALPHA_NUM, '');
  const id = `${projectId}-pr-${pr}`;
  if (id.length > 31) {
    return id.slice(0, 31);
  }
  return id;
}

/**
 * @param {string} certId
 * @param {boolean=} useInternalSSL
 * @returns {Array}
 */
function defaultListeners(certId, useInternalSSL) {
  return [
    pListeners.create(80, 80, TCP, TCP),
    useInternalSSL ? pListeners.create(443, 443, TCP, SSL, certId) :
      pListeners.create(80, 443, TCP, SSL, certId)
  ];
}

/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @param {string} deployment
 * @param {string} subnet
 * @param {string} securityGroup
 * @param {string} certId
 * @param {boolean=} useInternalSSL defaults to false
 * @returns {Q.Promise}
 */
function createDeployment(aws, projectId, deployment, subnet, securityGroup,
                          certId, useInternalSSL) {
  useInternalSSL = useInternalSSL ? true : false;
  const listeners = defaultListeners(certId, useInternalSSL);
  const tags = [
    tag.create(constants.PROJECT_TAG, projectId),
    tag.create(constants.DEPLOYMENT_TAG, deployment)
  ];
  const id = elbDeploymentId(projectId, deployment);
  return create(aws, listeners, [subnet], [securityGroup], id, tags);
}


/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @param {string} pr
 * @param {string} subnet
 * @param {string} securityGroup
 * @param {string} certId
 * @param {boolean=} useInternalSSL defaults to false
 * @returns {Q.Promise}
 */
function createPr(aws, projectId, pr, subnet, securityGroup, certId,
                  useInternalSSL) {
  useInternalSSL = useInternalSSL ? true : false;
  const listeners = defaultListeners(certId, useInternalSSL);
  const tags = [
    tag.create(constants.PROJECT_TAG, projectId),
    tag.create(constants.PR_TAG, pr)
  ];
  const id = elbPrId(projectId, pr);
  return create(aws, listeners, [subnet], [securityGroup], id, tags);
}

/**
 * @param {AwsWrapper} aws
 * @param {Array.<ElbPortListener>=} listeners
 * @param {string[]} subnets
 * @param {string[]} securityGroups
 * @param {string} loadBalancerId
 * @param {Array.<ElbTag>=}tags
 * @returns {Promise}
 */
function create(aws, listeners, subnets, securityGroups, loadBalancerId, tags) {
  tags = Array.isArray(tags) ? tags : [];
  return aws.elb.createLoadBalancer({
      Listeners: listeners,
      LoadBalancerName: loadBalancerId,
      SecurityGroups: securityGroups,
      Subnets: subnets,
      Tags: [tag.create(constants.CLUSTERNATOR_TAG, true)].concat(tags) })
    .then((results) => {
      return {
        dns: results.DNSName,
        id: loadBalancerId
      };
    });
}

/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @param {string} pr
 * @returns {Q.Promise}
 */
function destroyPr(aws, projectId, pr) {
  const id = elbPrId(projectId, pr);
  return destroy(aws, id);
}

/**
 * @param {AwsWrapper} aws
 * @param {string} projectId
 * @param {string} deployment
 * @returns {Q.Promise}
 */
function destroyDeployment(aws, projectId, deployment) {
  const id = elbDeploymentId(projectId, deployment);
  return destroy(aws, id);
}

/**
 * @param {AwsWrapper} aws
 * @param {string} loadBalancerId
 * @return {Q.Promise}
 */
function destroy(aws, loadBalancerId) {
  if (!loadBalancerId) {
    throw new TypeError('destroyLoadBalancer requires a loadBalacnerId');
  }
  return aws.elb.deleteLoadBalancer({
    LoadBalancerName: loadBalancerId
  });
}

function filterClusternatorTags(loadBalancerDescriptions, tagDescs) {
  const tagIds = tagDescs.map((tagDesc) => tagDesc.LoadBalancerName);
  const tags = tagDescs.map((tagDesc) => tagDesc.Tags);
  return loadBalancerDescriptions
    .filter((desc) => {
      const tagIndex = tagIds.indexOf(desc.LoadBalancerName);
      if (tagIndex === -1) {
        return false;
      }
      return tags.find((el) => el
        .Name
        .indexOf(constants.CLUSTERNATOR_TAG) === 0);
    });
}

function mapLoadBalancerIds(loadBalancerDescription) {
  return loadBalancerDescription.LoadBalancerName;
}

function describeAll(aws) {
  return aws.elb.describeLoadBalancers();
}

function describe(aws) {
  return describeAll(aws)
    .then((results) => describeTags(aws, results
      .LoadBalancerDescriptions
      .map(mapLoadBalancerIds))
      .then((tags) => filterClusternatorTags(
        results.LoadBalancerDescriptions, tags)));
}

function describeById(aws, id) {
  return aws.elb
    .describeLoadBalancers({
      LoadBalancerNames: [
        id
      ]})
    .then((results) => {
      if (!results.LoadBalancerDescriptions.length) {
        throw new Error(`describeDeployment: no deployment found: ${id}`);
      }
      return {
        dns: results.LoadBalancerDescriptions[0].DNSName
      };
    });
}

function describeDeployment(aws, projectId, deployment) {
  const id = elbDeploymentId(projectId, deployment);
  return describeById(aws, id);
}

function describePr(aws, projectId, pr) {
  const id = elbPrId(projectId, pr);
  return describeById(aws, id);
}

/**
 * @param {AwsWrapper} aws
 * @param {string[]} loadBalancerIds
 * @returns {Q.Promise}
 */
function describeTags(aws, loadBalancerIds) {
  return aws.elb
    .describeTags({ LoadBalancerNames: loadBalancerIds})
    .then((results) => results.TagDescriptions);
}

/**
 * @param {AwsWrapper} aws
 * @param {string} loadBalancerId
 * @param {string[]} instances
 * @returns {Promise}
 */
function registerInstances(aws, loadBalancerId, instances) {
  if (!Array.isArray(instances)) {
    throw new TypeError('registerInstances expects instances to be an array ' +
      'of strings');
  }
  const mappedInstances = instances.map((id) => {
    return {
      InstanceId: id
    };
  });
  return aws.elb.registerInstancesWithLoadBalancer({
    Instances: mappedInstances,
    LoadBalancerName: loadBalancerId
  });
}


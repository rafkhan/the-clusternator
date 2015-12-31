'use strict';

const R = require('ramda');
const constants = require('../constants');

module.exports = {
  createPortListener,
  createTag,
  createLoadBalancer,
  destroyLoadBalancer,
  describeLoadBalancers,
  describeAllLoadBalancers,
  helpers: {
    filterClusternatorTags
  }
};

function applySecurityGroupsToLoadBalancer() {

}

function attachLoadBalancerToSubnets() {

}

function configureHealthCheck() {

}

/**
 * @param {{ elb: AWS.ELB }} aws
 * @param {{InstancePort: number, LoadBalancerPort: number,
 InstanceProtocol: string, Protocol: string,
 SSLCertificateId: (string)}[]=} listeners
 * @param {string[]} subnets
 * @param {string[]} securityGroups
 * @param {string[]} availabilityZones
 * @param {string} loadBalancerId
 * @param {{ Key: string, Value: string }[]=}tags
 * @returns {Q.Promise}
 */
function createLoadBalancer(aws, listeners, subnets, securityGroups,
                            availabilityZones, loadBalancerId, tags) {
  tags = Array.isArray(tags) ? tags : [];
  return aws.elb.createLoadBalancer({
    Listeners: listeners,
    LoadBalancerName: loadBalancerId,
    AvailabilityZones: availabilityZones,
    SecurityGroups: securityGroups,
    Subnets: subnets,
    Tags: [createTag(constants.CLUSTERNATOR_TAG, true)].concat(tags)
  });
}

/**
 * @param {string} instancePort
 * @param {string} publicPort
 * @param {string} instanceProtocol
 * @param {string} publicProtocol
 * @param {string=} sslCertId
 * @returns {{InstancePort: number, LoadBalancerPort: number,
 InstanceProtocol: string, Protocol: string, SSLCertificateId: (string)}}
 */
function createPortListener(instancePort, publicPort, instanceProtocol,
                            publicProtocol, sslCertId) {
  return {
    InstancePort: instancePort,
    LoadBalancerPort: publicPort,
    InstanceProtocol: instanceProtocol,
    Protocol: publicProtocol,
    SSLCertificateId: sslCertId || ''
  };
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {{Key: string, Value: string}}
 */
function createTag(key, value) {
  return {
    Key: key,
    Value: value
  };
}

/**
 * @param {{ elb: AWS.ELB }} aws
 * @param {string} loadBalancerId
 * @return {Q.Promise}
 */
function destroyLoadBalancer(aws, loadBalancerId) {
  if (!loadBalancerId) {
    throw new TypeError('destroyLoadBalancer requires a loadBalacnerId');
  }
  return aws.elb.deleteLoadBalancer({
    LoadBalancerName: loadBalancerId
  });
}

function deleteLoadBalancer() {

}

function deregisterInstancesFromLoadBalancer() {

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

function describeAllLoadBalancers(aws) {
  return aws.elb.describeLoadBalancers();
}

function describeLoadBalancers(aws) {
  return describeAllLoadBalancers(aws)
    .then((results) => describeTags(aws, results
      .LoadBalancerDescriptions
      .map(mapLoadBalancerIds))
      .then((tags) => filterClusternatorTags(
        results.LoadBalancerDescriptions, tags)));
}

/**
 * @param {{ elb: AWS.ELB }} aws
 * @param {string[]} loadBalancerIds
 * @returns {Q.Promise}
 */
function describeTags(aws, loadBalancerIds) {
  return aws.elb
    .describeTags({ LoadBalancerNames: loadBalancerIds})
    .then((results) => results.TagDescriptions);
}

function enableAvailabilityZonesForLoadBalancer() {

}

function registerInstancesWithLoadBalancer() {

}


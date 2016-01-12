'use strict';

module.exports = createAwsFile;

/**
 * @param {string} region
 * @param {string} vpcId
 * @param {string} route53Id
 * @param {string} registryId
 * @param {number} ttl
 * @returns {{region: string, vpcId: string, route53Id: string,
 registryId: string, ttl: number}}
 */
function createAwsFile(region, vpcId, route53Id, registryId, ttl) {
  return {
    region,
    vpcId,
    route53Id,
    registryId,
    ttl
  };
}
'use strict';

module.exports = createAwsFile;

/**
 * @param {string} region
 * @param {string} vpcId
 * @param {string} route53Id
 * @param {string} registryId
 * @returns {{region: string, vpcId: string, route53Id: string,
 registryId: string}}
 */
function createAwsFile(region, vpcId, route53Id, registryId) {
  return {
    region: region,
    vpcId: vpcId,
    route53Id: route53Id,
    registryId: registryId
  };
}
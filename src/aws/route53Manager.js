'use strict';

const R = require('ramda');
const util = require('../util');
const rid = require('../resourceIdentifier');
const skeletons = require('./route53Skeletons');
const constants = require('../constants');

/**
  @param {Route53} AWS Library
  @param {string} zoneId
  @return {Route53Manager}
*/
function getRoute53(route53, zoneId) {
  route53 = util.makePromiseApi(route53);

  /**
    @param {GetHostedZoneResult}
    @return {string}
  */
  function pluckHostedZoneName(getHostedZoneResult) {
    return getHostedZoneResult.HostedZone.Name;
  }

  /**
    @return Q.Promise<string> promise to find the TLD for the hosted zone
  */
  function findTld() {
    return route53.getHostedZone({
      Id: zoneId
    }).then(pluckHostedZoneName);
  }

  /**
    @param {string} action
    @return {Change}
  */
  function createChange(action) {
    var actionIndex = skeletons.CHANGE_ACTIONS.indexOf(action),
      change;
    if (actionIndex === -1) {
      throw new TypeError('route53: invalid change action: ' + action +
        ' MUST be one of ' + skeletons.CHANGE_ACTIONS.join(', '));
    }
    change = util.clone(skeletons.CHANGE);
    change.Action = action;
    return change;
  }

  /**
    @param {string=} comment
    @return {ChangeBatch}
  */
  function createChangeBatch(comment) {
    var changeBatch = util.clone(skeletons.CHANGE_BATCH);
    if (comment) {
      changeBatch.Comment = comment;
    }
    return changeBatch;
  }

  /**
    @param {string} value
    @return {ResourceRecord}
  */
  function createResourceRecord(value) {
    if (!value) {
      throw new TypeError('route53: createResourceRecord expecting value ' +
        'parameter');
    }
    var resourceRecord = util.clone(skeletons.RESOURCE_RECORD);
    resourceRecord.Value = value;
    return resourceRecord;
  }

  /**
    @param {*} type
    @return {string} (from resourceRecrodSetTypes)
  */
  function validateResourceRecordSetType(type) {
    var typeIndex = skeletons.RECORD_TYPES.indexOf(type);
    typeIndex = typeIndex === -1 ? 1 : typeIndex;

    return skeletons.RECORD_TYPES[typeIndex];
  }

  /**
    @param {string} name
    @param {string} type
    @param {string} resourceValue
    @return {ResourceRecordSet}
  */
  function createResourceRecordSet(name, type, resourceValue) {
    type = validateResourceRecordSetType(type);
    if (!name) {
      throw new TypeError('route53: createResourceRecordSet expecting ' +
        '"name" parameter');
    }
    var resourceRecordSet = util.clone(skeletons.RESOURCE_RECORD_SET);
    resourceRecordSet.Name = name;
    resourceRecordSet.Type = type;
    resourceRecordSet.ResourceRecords.push(
      createResourceRecord(resourceValue)
    );
    return resourceRecordSet;
  }

  /**
    @param {string} verb
    @param {string} domainName
    @param {string} ip
    @param {string} tld
    @param {string} type
    @param {Object=} config
  */
  function changeRecordParams(verb, domainName, ip, tld, type, config) {
    config = config || {};
    var changeBatch = createChangeBatch(),
      change = createChange(verb),
      params = {
        ChangeBatch: changeBatch,
        HostedZoneId: zoneId
      };
    changeBatch.Changes.push(change);

    params.ChangeBatch.Changes[0].ResourceRecordSet =
      createResourceRecordSet(domainName + '.' + tld, type, ip);

    return R.merge(params, config);
  }

  /**
    @param {string} domainName
    @param {string} ip
    @param {string} tld
    @param {string} type
    @param {Object=} config
  */
  function createRecordParams(domainName, ip, tld, type, config) {
    return changeRecordParams('CREATE', domainName, ip, tld, type, config);
  }

  /**
    @param {string} domainName
    @param {string} ip
    @param {string} tld
    @param {string} type
    @param {Object=} config
  */
  function destroyRecordParams(domainName, ip, tld, type, config) {
    return changeRecordParams('DELETE', domainName, ip, tld, type, config);
  }

  /**
    @param {string} pid
    @param {string} pr
    @param {string} ip
    @param {Object=} Route53 config object (optional)
    @return {Q.Promise}
  */
  function createPRARecord(pid, pr, ip, config) {
    return findTld().then((tld) => {
      var domainName = rid.generatePRSubdomain(pid, pr);
      return route53
        .changeResourceRecordSets(
          createRecordParams(domainName, ip, tld, 'A', config))
        .then(() => domainName);
    });
  }

  /**
   @param {string} pid
   @param {string} pr
   @param {string} url
   @param {Object=} config object (optional)
   @return {Q.Promise}
   */
  function createPRCNameRecord(pid, pr, url, config) {
    return findTld().then((tld) => {
      var domainName = rid.generatePRSubdomain(pid, pr);
      return route53
        .changeResourceRecordSets(
          createRecordParams(domainName, url, tld, 'CNAME', config))
        .then(() => domainName);
    });
  }

  /**
   * @param {string} pid
   * @param {string} deployment
   * @returns {string}
   */
  function generateDeploymentDomain(pid, deployment) {
    if (deployment === 'master') {
      return pid;
    }
    return pid + '-' + deployment;
  }

  /**
   @param {string} pid
   @param {string} deployment
   @param {string} ip
   @param {Object=} Route53 config object (optional)
   @return {Q.Promise}
   */
  function createDeploymentARecord(pid, deployment, ip, config) {
    return findTld()
      .then((tld) => {
      var domainName = generateDeploymentDomain(pid, deployment);
      return route53
        .changeResourceRecordSets(
          createRecordParams(domainName, ip, tld, 'A', config))
        .then(() => domainName);
    });
  }

  /**
   @param {string} pid
   @param {string} deployment
   @param {string} url
   @param {Object=} config object (optional)
   @return {Q.Promise}
   */
  function createDeploymentCNameRecord(pid, deployment, url, config) {
    return findTld()
      .then((tld) => {
        var domainName = generateDeploymentDomain(pid, deployment);
        return route53
          .changeResourceRecordSets(
            createRecordParams(domainName, url, tld, 'CNAME', config))
          .then(() => domainName);
      });
  }

  /**
    @param {string} pid
    @param {string} pr
    @param {string} ip
    @param {Object=} Route53 config object (optional)
    @return {Q.Promise}
  */
  function destroyPRARecord(pid, pr, ip, config) {
    return findTld().then((tld) => {
      const domainName = rid.generatePRSubdomain(pid, pr);
      return route53.changeResourceRecordSets(
        destroyRecordParams(domainName, ip, tld, 'A', config)
      );
    });
  }

  /**
   @param {string} pid
   @param {string} pr
   @param {string} url
   @param {Object=} Route53 config object (optional)
   @return {Q.Promise}
   */
  function destroyPRCNameRecord(pid, pr, url, config) {
    return findTld().then((tld) => {
      const domainName = rid.generatePRSubdomain(pid, pr);
      return route53.changeResourceRecordSets(
        destroyRecordParams(domainName, url, tld, 'CNAME', config)
      );
    });
  }

  /**
   * @param pid
   * @param deployment
   * @param ip
   * @param config
   * @returns {Request|Promise.<T>}
   */
  function destroyDeploymentARecord(pid, deployment, ip, config) {
    return findTld().then((tld) => {
      const domainName = generateDeploymentDomain(pid, deployment);
      return route53.changeResourceRecordSets(
        destroyRecordParams(domainName, ip, tld, 'A', config)
      );
    });
  }

  /**
   * @param pid
   * @param deployment
   * @param url
   * @param config
   * @returns {Request|Promise.<T>}
   */
  function destroyDeploymentCNameRecord(pid, deployment, url, config) {
    return findTld().then((tld) => {
      const domainName = generateDeploymentDomain(pid, deployment);
      return route53.changeResourceRecordSets(
        destroyRecordParams(domainName, url, tld, 'CNAME', config)
      );
    });
  }

  /**
    @return {Q.Promise<Object[]>}
  */
  function list() {
    return route53.listHostedZones({}).then((result) => {
      return result.HostedZones;
    });
  }

  /**
    @param {{ Id: string }} resource
    @return {string}
  */
  function pluckId(resource) {
    var splits = resource.Id.split('/');
    return splits[splits.length - 1];
  }

  /**
    @param {{ Tags: {{ Key: string, Value: string }}[] }} tagset
    @return {string}
  */
  function findFirstTag(tagSet) {
    var id = null;
    tagSet.forEach((r) => {
      r.Tags.forEach((t) => {
        if (t.Key === constants.CLUSTERNATOR_TAG) {
          id = r.ResourceId;
        }
      });
    });
    return id;
  }

  /**
    @param {HostedZone[]} l
    @return {Q.Promise}
  */
  function listTags(l) {
    return route53.listTagsForResources({
      ResourceType: 'hostedzone',
      ResourceIds: l.map(pluckId)
    }).then(function(tagSet) {
      return tagSet.ResourceTagSets;
    });
  }

  /**
    @return {Q.Promise<string>}
  */
  function findId() {
    return list().then((l) => {
        if (!l.length) {
          throw new Error('Route53: No Hosted Zones Found');
        }
        return listTags(l).then((tagSet) => {
        var id = findFirstTag(tagSet);
        if (id) {
          return constants.AWS_R53_ZONE_PREFIX + id;
        }
        throw new Error('Route53: No Clusternator Resources Found');
      });
    });
}

return {
  list,
  createPRARecord,
  createPRCNameRecord,
  createDeploymentARecord,
  createDeploymentCNameRecord,
  destroyPRARecord,
  destroyPRCNameRecord,
  destroyDeploymentARecord,
  destroyDeploymentCNameRecord,
  findId,
  helpers: {
    createRecordParams,
    createChange,
    createChangeBatch,
    createResourceRecord,
    createResourceRecordSet,
    findTld,
    validateResourceRecordSetType,
    pluckHostedZoneName,
    pluckId,
    findFirstTag
  }
};
}

module.exports = getRoute53;

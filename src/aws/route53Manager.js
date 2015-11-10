'use strict';

var Q = require('q'),
  R = require('ramda'),
  util = require('../util'),
  rid = require('../resourceIdentifier'),
  skeletons = require('./route53Skeletons'),
  constants = require('../constants');

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
    @param {string} pid
    @param {string} pr
    @param {string} ip
    @param {string} tld
    @param {Object=} config
  */
  function changeAParams(verb, pid, pr, ip, tld, config) {
    config = config || {};
    var domainName = rid.generatePRSubdomain(pid, pr),
      changeBatch = createChangeBatch(),
      change = createChange(verb),
      params = {
        ChangeBatch: changeBatch,
        HostedZoneId: zoneId
      };
    changeBatch.Changes.push(change);

    params.ChangeBatch.Changes[0].ResourceRecordSet =
      createResourceRecordSet(domainName + '.' + tld, 'A', ip);

    return R.merge(params, config);
  }

  /**
    @param {string} pid
    @param {string} pr
    @param {string} ip
    @param {string} tld
    @param {Object=} config
  */
  function createAParams(pid, pr, ip, tld, config) {
    return changeAParams('CREATE', pid, pr, ip, tld, config);
  }

  /**
    @param {string} pid
    @param {string} pr
    @param {string} ip
    @param {string} tld
    @param {Object=} config
  */
  function destroyAParams(pid, pr, ip, tld, config) {
    return changeAParams('DELETE', pid, pr, ip, tld, config);
  }

  /**
    @param {string} pid
    @param {string} pr
    @param {string} ip
    @param {Object=} Route53 config object (optional)
    @return {Q.Promise}
  */
  function createPRARecord(pid, pr, ip, config) {
    return findTld().then(function(tld) {
      return route53.changeResourceRecordSets(
        createAParams(pid, pr, ip, tld, config)
      );
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
    return findTld().then(function(tld) {
      return route53.changeResourceRecordSets(
        destroyAParams(pid, pr, ip, tld, config)
      );
    });
  }

  return {
    createPRARecord,
    destroyPRARecord,
    helpers: {
      createAParams,
      createChange,
      createChangeBatch,
      createResourceRecord,
      createResourceRecordSet,
      findTld,
      validateResourceRecordSetType,
      pluckHostedZoneName
    }
  };
}

module.exports = getRoute53;

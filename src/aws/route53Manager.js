'use strict';

const resourceRecordSetTypes = ['SOA', 'A', 'TXT', 'NS', 'CNAME', 'MX', 'PTR',
  'SRV', 'SPF', 'AAAA'
];

var R = require('ramda'),
  Q = require('q'),
  util = require('../util'),
  skeletons = require('./route53Skeletons'),
  constants = require('../constants');

function getRoute53(route53, zoneId) {
  route53 = util.makePromiseApi(route53);

/**
  @return Q.Promise<string> promise to find the TLD for the hosted zone
*/
  function findTld() {
      return route53.getHostedZone({ Id: zoneId }).then(function (result) {
          return result.HostedZone.Name;
      });
  }

  function describe() {

  }

  function createChange() {}

  function createChangeBatch() {

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
    return R.merge(skeletons.RESOURCE_RECORD, { Value: value });
  }

  /**
    @param {*} type
    @return {string} (from resourceRecrodSetTypes)
  */
  function validateResourceRecordSetType(type) {
    var typeIndex = resourceRecordSetTypes.indexOf(type);
    typeIndex = typeIndex === -1 ? 1 : typeIndex;

    return resourceRecordSetTypes[typeIndex];
  }

  /**
    @param {string} name
    @param {string} type
    @return {ResourceRecordSet}
  */
  function createResourceRecordSet(name, type) {
    type = validateResourceRecordSetType(type);
    if (!name) {
      throw new TypeError('route53: createResourceRecordSet expecting ' +
        '"name" parameter');
    }
  }

  function create(pid, pr, config) {
    config = config || {};
    var params = R.merge(constants.AWS_R53_SUBDOMAIN, config);
    return route53.changeResourceRecordSets(params).then(function() {

    });
  }

  function destroy(pid, pr) {
    var d = Q.defer();
    d.resolve();
    return d.promise;
  }

  return {
    describe,
    create,
    destroy,
    helpers: {
      createChange,
      createResourceRecord,
      createResourceRecordSet,
      findTld,
      validateResourceRecordSetType
    }
  };
}

module.exports = getRoute53;

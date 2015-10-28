'use strict';

var R = require('ramda');

var VALID_ID_TYPES = ['pr', 'sha', 'time', 'ttl'];

/**
 * RID format: typeA-valueA--typeB-valueB
 */
function parseRID(rid) {
  var doubleDashRegex = /--/g;

  var splits = rid.split(doubleDashRegex);

  var segments = R.map(function (idSegment) {
    var dashIdx = idSegment.indexOf('-');
    var type = idSegment.substring(0, dashIdx);
    var value = idSegment.substring(dashIdx + 1);

    return {
      type: type,
      value: value
    };
  }, splits);

  var result = R.reduce(function (memo, seg) {
    memo[seg.type] = seg.value;
    return memo;
  }, {}, segments);

  return result;
}

function generateRID(params) {
  var idSegments = R.mapObjIndexed(function (val, key, obj) {
    return key + '-' + val;
  }, params);

  var validSegmentKeys = R.filter(function (key) {
    return R.contains(key, VALID_ID_TYPES);
  }, R.keys(idSegments));

  var rid = R.reduce(function (ridStr, segKey) {
    var idSeg = idSegments[segKey];
    return ridStr + idSeg + '--';
  }, '', validSegmentKeys);

  // Remove trailing --
  return rid.replace(/--$/g, '');
}

function generateRIDFromEnv() {}

module.exports = {
  parseRID: parseRID,
  generateRID: generateRID
};
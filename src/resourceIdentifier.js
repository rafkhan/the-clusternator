'use strict';

const R = require('ramda');
const constants = require('./constants');
const RX_DOUBLE_DASH = /--/g;
const RX_DOUBLE_DASH_END = /--$/g;


const VALID_ID_TYPES = ['pr', 'sha', 'time', 'ttl', 'pid', 'deployment'];


/**
 * @param {string} rid
 * @returns {boolean}
 */
function isRID(rid) {
  return rid.indexOf(constants.CLUSTERNATOR_PREFIX) === 0;
}

/**
 * @param {string} idSegment
 * @returns {{type: string, value: string}}
 */
function mapIdSegments(idSegment) {
  const dashIdx = idSegment.indexOf('-');
  const type = idSegment.substring(0, dashIdx);
  const value = idSegment.substring(dashIdx + 1);

  return {
    type: type,
    value: value
  };
}

/**
 * @param {{type: string, value: string}} memo
 * @param {{type: string, value: string}} seg
 * @returns {*}
 */
function reduceSegments(memo, seg) {
  memo[seg.type] = seg.value;
  return memo;
}

/**
 * RID format: typeA-valueA--typeB-valueB
 * @param {string} rid
 * @returns {Object}
 */
function parseRID(rid) {
  if (!isRID(rid)) {
    return null;
  }
  rid = rid.slice(constants.CLUSTERNATOR_PREFIX.length + 1);

  const splits = rid.split(RX_DOUBLE_DASH);
  const segments = R.map(mapIdSegments, splits);

  const result = R.reduce(reduceSegments, {}, segments);

  return result;
}


function generateRID(params) {
  const idSegments = R
    .mapObjIndexed((val, key) => `${key}-${val}`, params);

  const validSegmentKeys = R.filter((key) => {
    return R.contains(key, VALID_ID_TYPES);
  }, R.keys(idSegments));

  const rid = R.reduce((ridStr, segKey) => `${ridStr}${idSegments[segKey]}--`,
    '', validSegmentKeys);

  if (!rid) { return ''; }

  // Remove trailing --
  const trimmedRid = rid.replace(RX_DOUBLE_DASH_END, '');
  return `${constants.CLUSTERNATOR_PREFIX}-${trimmedRid}`;
}

/**
 @param {string} projectId
 @param {string} pr
 */
function generatePRSubdomain(projectId, pr) {
  if (!projectId || !pr) {
    throw new TypeError('generateSubdomain requires a projectId, and pr');
  }
  return `${projectId}-pr-${pr}`;
}

/**
 @param {string} projectId
 @param {string} label
 */
function generateSubdomain(projectId, label) {
  if (!projectId || !label) {
    throw new TypeError('generateSubdomain requires a projectId, and label');
  }
  return `${projectId}-${label}`;
}

/**
 * @param {string} name
 * @returns {string}
 */
function clusternatePrefixString(name) {
  if (name.indexOf(constants.CLUSTERNATOR_PREFIX) !== 0) {
    name = constants.CLUSTERNATOR_PREFIX + '-' + name;
  }
  return name;
}

/**
 * @param {string} name
 * @returns {boolean}
 */
function isPrefixed(name) {
  return name.indexOf(constants.CLUSTERNATOR_PREFIX) === 0;
}


module.exports = {
  parseRID,
  generateRID,
  generatePRSubdomain,
  generateSubdomain,
  clusternatePrefixString,
  isPrefixed,
  isRID
};

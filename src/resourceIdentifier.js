'use strict';

var R = require('ramda');

/**
 * RID format: typeA-valueA--typeB-valueB
 */
function parseRID(rid) {
  var doubleDashRegex = /--/g;

  var splits = rid.split(doubleDashRegex);

  var segments = R.map((idSegment) => {
    var dashIdx = idSegment.indexOf('-');
    var type = idSegment.substring(0, dashIdx);
    var value = idSegment.substring(dashIdx + 1);

    return {
      type: type,
      value: value
    }
  }, splits);

  var result = R.reduce((memo, seg) => {
    memo[seg.type] = seg.value;
    return memo;
  }, {}, segments);

  return result;
}


module.exports = {
  parseRID: parseRID
}

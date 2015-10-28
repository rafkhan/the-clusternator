'use strict';

var R = require('ramda');

/**
 *
 * RID format: typeA-valueA--typeB-valueB
 */
function parseRID(rid) {
  var doubleDashRegex = /--/g;

  var splits = rid.split(doubleDashRegex);

  var results = R.map((idSegment) => {
    var dashIdx = idSegment.indexOf('-');
    var type = idSegment.substring(0, dashIdx);
    var value = idSegment.substring(dashIdx + 1);

    return {
      type: type,
      value: value
    }
  }, splits);

  return results;
}


module.exports = {
  parseRID: parseRID
}

'use strict';

var R = require('ramda');

/**
 *
 * RID format: typeA-valueA--typeB-valueB
 */
function parseRID(rid) {
  var doubleDashRegex = /--/g;

  var splits = rid.split(doubleDashRegex);
  var results = R.map(function (idSegment) {
    var dashIdx = idSegment.indexOf('-');
    var type = idSegment.substring(0, dashIdx);
    var value = idSegment.substring(dashIdx);

    return {
      type: type,
      value: value
    };
  });

  return results;
}

module.exports = {
  parseRID: parseRID
};
'use strict';

var resourceId = require('../../src/resourceIdentifier');
var cPrefix = 'clusternator-';

/*global describe, it, expect */
/*eslint no-unused-expressions: 0*/
describe('parser', function() {
  it('should separate types and values in ID segment', function() {
    var rid = cPrefix + 'type-value';
    var segments = resourceId.parseRID(rid);

    expect(segments.type).equal('value');
  });

  it('should separate multiple types and values in ID segments', function() {
    var rid = cPrefix + 'A-B--C-D';
    var segments = resourceId.parseRID(rid);

    expect(segments['A']).equal('B');
    expect(segments['C']).equal('D');
  });

  it('should return null if given an id not generated (prefixed) by ' +
  'clusternator', function () {
    var rid = 'A-B--C-D';
    var segments = resourceId.parseRID(rid);

    expect(segments).equal(null);
  });
});

describe('generator', function() {
  it('should generate RID from single piece of info', function() {
    var rid = resourceId.generateRID({
      sha: '1234'
    });

    expect(rid).equal(cPrefix + 'sha-1234');
  });

  it('should generate RID from multiple pieces of info', function() {
    var rid = resourceId.generateRID({
      sha: '1234',
      time: '4321'
    });

    var validRID = rid === cPrefix + 'sha-1234--time-4321' ||
                   rid === cPrefix + 'time-4321--sha-1234';

    expect(validRID).to.be.true;
  });

  it('should ignore invalid segment keys', function() {
    var rid = resourceId.generateRID({
      sha: '1234',
      ignoreMe: 'please'
    });

    expect(rid).equal(cPrefix + 'sha-1234');
  });
});

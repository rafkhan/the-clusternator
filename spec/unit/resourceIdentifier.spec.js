'use strict';

var resourceId = require('../../src/resource-identifier');
var cPrefix = 'clusternator-';

/*global describe, it, expect */
/*eslint no-unused-expressions: 0*/
describe('parser', () => {
  it('should separate types and values in ID segment', () => {
    var rid = cPrefix + 'type-value';
    var segments = resourceId.parseRID(rid);

    expect(segments.type).equal('value');
  });

  it('should separate multiple types and values in ID segments', () => {
    var rid = cPrefix + 'A-B--C-D';
    var segments = resourceId.parseRID(rid);

    expect(segments['A']).equal('B');
    expect(segments['C']).equal('D');
  });

  it('should return null if given an id not generated (prefixed) by ' +
    'clusternator', () => {
      var rid = 'A-B--C-D';
      var segments = resourceId.parseRID(rid);

      expect(segments).equal(null);
    });
});

describe('generator', () => {
  it('should generate RID from single piece of info', () => {
    var rid = resourceId.generateRID({
      sha: '1234'
    });

    expect(rid).equal(cPrefix + 'sha-1234');
  });

  it('should generate RID from multiple pieces of info', () => {
    var rid = resourceId.generateRID({
      sha: '1234',
      time: '4321'
    });

    var validRID = rid === cPrefix + 'sha-1234--time-4321' ||
      rid === cPrefix + 'time-4321--sha-1234';

    expect(validRID).to.be.true;
  });

  it('should ignore invalid segment keys', () => {
    var rid = resourceId.generateRID({
      sha: '1234',
      ignoreMe: 'please'
    });

    expect(rid).equal(cPrefix + 'sha-1234');
  });

  it('generatePRSubdomain should throw without a pr', () => {
    expect(() => {
      resourceId.generatePRSubdomain('proj');
    }).to.throw(Error);
  });

  it('generatePRSubdomain should throw without a projectId', () => {
    expect(() => {
      resourceId.generatePRSubdomain();
    }).to.throw(Error);
  });

  it('generateSubdomain should throw without a label', () => {
    expect(() => {
      resourceId.generateSubdomain('whoa');
    }).to.throw(Error);
  });

  it('generateSubdomain should throw without a projectId', () => {
    expect(() => {
      resourceId.generateSubdomain();
    }).to.throw(Error);
  });

  it('generatePRSubdomain should return projectId-pr-pr#', () => {
    expect(resourceId.generatePRSubdomain('test', '1')).to.equal('test-pr-1');
  });

  it('generateSubdomain should return projectId-label', () => {
    expect(resourceId.generateSubdomain('test', 'me')).to.equal('test-me');
  });
});

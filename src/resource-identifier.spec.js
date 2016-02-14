'use strict';

const resourceId = require('./resource-identifier');
const cPrefix = 'clusternator-';

/*global describe, it, expect */
describe('parser', () => {
  it('should separate types and values in ID segment', () => {
    const rid = cPrefix + 'type-value';
    const segments = resourceId.parseRID(rid);

    expect(segments.type).equal('value');
  });

  it('should separate multiple types and values in ID segments', () => {
    const rid = cPrefix + 'A-B--C-D';
    const segments = resourceId.parseRID(rid);

    expect(segments['A']).equal('B');
    expect(segments['C']).equal('D');
  });

  it('should return null if given an id not generated (prefixed) by ' +
    'clusternator', () => {
      const rid = 'A-B--C-D';
      const segments = resourceId.parseRID(rid);

      expect(segments).equal(null);
    });
});

describe('generator', () => {
  it('should generate RID from single piece of info', () => {
    const rid = resourceId.generateRID({
      sha: '1234'
    });

    expect(rid).equal(cPrefix + 'sha-1234');
  });

  it('should generate RID from multiple pieces of info', () => {
    const rid = resourceId.generateRID({
      sha: '1234',
      time: '4321'
    });

    const validRID = rid === cPrefix + 'sha-1234--time-4321' ||
      rid === cPrefix + 'time-4321--sha-1234';

    expect(validRID).to.be.true;
  });

  it('should ignore invalid segment keys', () => {
    const rid = resourceId.generateRID({
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

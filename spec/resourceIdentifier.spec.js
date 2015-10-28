'use strict';

var resourceId = require('../src/resourceIdentifier');

describe('parser', function() {
  it('should separate types and values in ID segment', function() {
    var rid = 'type-value';
    var segments = resourceId.parseRID(rid);
    
    expect(segments.type).equal('value');
  });

  it('should separate multiple types and values in ID segments', function() {
    var rid = 'A-B--C-D';
    var segments = resourceId.parseRID(rid);
    
    expect(segments['A']).equal('B');
    expect(segments['C']).equal('D');
  });
});

describe('generator', function() {
  it('should generate RID from single piece of info', function() {
    var rid = resourceId.generateRID({
      sha: '1234'
    });

    expect(rid).equal('sha-1234');
  });

  it('should generate RID from multiple pieces of info', function() {
    var rid = resourceId.generateRID({
      sha: '1234',
      time: '4321'
    });

    var validRID = rid === 'sha-1234--time-4321' ||
                   rid === 'time-4321--sha-1234';

    expect(validRID).to.be.true;
  });

  it('should ignore invalid segment keys', function() {
    var rid = resourceId.generateRID({
      sha: '1234',
      ignoreMe: 'please'
    });

    expect(rid).equal('sha-1234');
  });
});

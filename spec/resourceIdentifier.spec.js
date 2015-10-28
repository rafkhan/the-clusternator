'use strict';

var resourceId = require('../src/resourceIdentifier');

describe('parser', function() {
  it('should separate types and values in ID segment', function() {
    var rid = 'type-value';
    var segments = resourceId.parseRID(rid);
    
    expect(segments.type).equal('value');
  })

  it('should separate multiple types and values in ID segments', function() {
    var rid = 'A-B--C-D';
    var segments = resourceId.parseRID(rid);
    
    expect(segments['A']).equal('B');
    expect(segments['C']).equal('D');
  })
});

'use strict';

var resourceId = require('../src/resourceIdentifier');

describe('parser', function() {
  it('should separate types and values in ID segment', function() {
    var rid = 'type-value';
    var segments = resourceId.parseRID(rid);
    
    expect(segments[0].type).equal('type');
    expect(segments[0].value).equal('value');
  })

  it('should separate multiple types and values in ID segments', function() {
    var rid = 'A-B--C-D';
    var segments = resourceId.parseRID(rid);
    
    expect(segments[0].type).equal('A');
    expect(segments[0].value).equal('B');
    expect(segments[1].type).equal('C');
    expect(segments[1].value).equal('D');
  })
});

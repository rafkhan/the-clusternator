'use strict';

var util = require('../src/util');
require('./chai');



/*global describe, it */
describe('utility functions', function () {
  it('should have a function that quotes a supplied argument', function () {
    expect(util.quote('booya')).equal('"booya"');
  });
});

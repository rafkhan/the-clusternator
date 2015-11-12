'use strict';

var rewire = require('rewire');

var config = rewire('../../src/config');
require('./chai');

/*global describe, it, expect */
/*eslint no-unused-expressions:0*/
describe('config provider', () => {
  it('should return a config object', () => {
    expect(config()).to.be.ok;
  });
});

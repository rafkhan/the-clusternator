'use strict';

var rewire = require('rewire');

var config = rewire('../../src/config');
require('./chai');

/*global describe, it, expect */
/*eslint no-unused-expressions:0*/
describe('config provider', function () {
  it('should return a config object', function (){
    expect(config()).to.be;
  });
});

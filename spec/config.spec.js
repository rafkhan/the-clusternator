'use strict';

var rewire = require('rewire');

var config = rewire('../src/config');
require('./chai');

/*global describe, it, expect */
describe('config provider', function () {
  it('should start off with only an init function', function (){
      var count = 0, name = '';
      // (ramda.forEach does not work with this)
      Object.keys(config).forEach(function (attr){
        name = attr;
        count += 1;
      });
      expect(count).equal(1);
      expect(name).equal('init');
  });
});

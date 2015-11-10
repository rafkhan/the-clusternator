
'use strict';

var rewire = require('rewire'),
  constants = require('../../../src/constants');

var Route53 = rewire('../../../src/aws/route53Manager');
require('../chai');

/*global describe, it, expect, beforeEach */
/*eslint no-unused-expressions: 0*/
describe('route53Manager', function() {
  var route53;
  beforeEach(function() {
    route53 = Route53();
  });

});

'use strict';

var common = require('../../../src/aws/common');
require('../chai');



/*global describe, it, expect */
/*eslint no-unused-expressions:0*/
describe('common AWS functions', function () {
  it('should have a function that makes an AWS key/value filter',
  function () {
    expect(common.makeAWSFilter('t', 1)).to.be;
  });

  it('should have a function that makes an AWS VPC filter',
  function () {
    expect(common.makeAWSFilter(1)).to.be;
  });
});

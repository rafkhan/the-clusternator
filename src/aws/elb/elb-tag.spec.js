'use strict';

const rewire = require('rewire');

const eTag = rewire('./elb-tag');
require('../../chai');


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: ELB Tag', () => {
  it('should be a constructor function', () => {
    expect(new eTag.create()).to.be.ok;
  });
  it('should function without new', () => {
    expect(eTag.create()).to.be.ok;
  });
});

'use strict';

const rewire = require('rewire');

const pl = rewire('./port-listener');
require('../../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: ELB: Port Listener', () => {
  it('should be a constructor function', () => {
    expect(new pl.create()).to.be.ok;
  });
  it('should function without new', () => {
    expect(pl.create()).to.be.ok;
  });
});

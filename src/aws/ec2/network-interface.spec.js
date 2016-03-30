'use strict';

const rewire = require('rewire');

const nic = rewire('./network-interface');
const C = require('../../chai');

function initData() {
}


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: EC2: Network Interface', () => {

  beforeEach(initData);

  describe('create function', () => {
    it('should throw without a security group', () => {
      expect(() => nic.create(null, 'subnetId')).to.throw(TypeError);
    });
    
    it('should throw without a subnetId', () => {
      expect(() => nic.create('sg')).to.throw(TypeError); 
    });
    
    it('should produce a new NetworkInterface', () => {
      expect(nic.create('sg', 'subnet') instanceof nic.NetworkInterface)
        .to.be.ok;
    });
  });
});

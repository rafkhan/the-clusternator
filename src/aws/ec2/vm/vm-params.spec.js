'use strict';

const rewire = require('rewire');
const nic = require('./../network-interface');

const ec2VmParams = rewire('./vm-params');
const C = require('../../../chai');

function initData() {
}


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: EC2: VM Params', () => {

  beforeEach(initData);

  describe('create function', () => {
    it('should throw without a network interface', () => {
      expect(() => ec2VmParams.create(null, 'subnetId')).to.throw(TypeError);
    });

    it('should produce a new VmParams', () => {
      const nc = nic.create('sg', 'subnet');
      expect(ec2VmParams.create(nc) instanceof ec2VmParams.VmParams)
        .to.be.ok;
    });
  });
});

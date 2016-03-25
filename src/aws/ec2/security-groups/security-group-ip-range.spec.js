'use strict';

const rewire = require('rewire');

const sg = rewire('./security-group-ip-range');
const C = require('../../../chai');

function initData() {
}


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: EC2: Security Group IP Range', () => {

  beforeEach(initData);

  describe('create function', () => {
    it('should throw without a cidrIp', () => {
      expect(() => sg.create()).to.throw(TypeError);
    });
    
    it('should return a new SgIpRange', () => {
      expect(sg.create('192.168.1.1') instanceof sg.SgIpRange).to.be.ok;
    });
  });
});

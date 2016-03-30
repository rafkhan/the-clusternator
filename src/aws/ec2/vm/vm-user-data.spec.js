'use strict';

const rewire = require('rewire');

const vmu = rewire('./vm-user-data');
const C = require('../../../chai');

function initData() {
}


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: EC2: VM User Data', () => {

  beforeEach(initData);

  describe('stringArrayToNewLineBase64 function', () => {
    it('should throw if not given an array', () => {
      expect(() => vmu.helpers.stringArrayToNewLineBase64())
        .to.throw(TypeError);
    }); 
    
    it('should return a base64 string separated by newlines', () => {
      // base64
      // > a
      // > b ctrl+d
      // YQpi
      expect(vmu.helpers.stringArrayToNewLineBase64(['a', 'b']))
        .to.equal('YQpi');
    });
  });

  describe('processSSHKeys function', () => {
    
    it('should throw a TypeError with no input', () => {
      expect(() => vmu.helpers.processSSHKeys()).to.throw(TypeError);
    });
    
    it('should take an array of strings and return an augmented array of ' +
      'strings', () => {
      const input = ['public-key', 'public-key-2'];
      const result = vmu.helpers.processSSHKeys(input);
      expect(result.length > input.length).to.be.ok;
    });
  });

  describe('getEcs function', () => {
    it('should throw without a clusterName', () => {
      expect(() => vmu.getEcs()).to.throw(TypeError);
    });
    
    it('should return a string when _not_ given an sshKeys param', () => {
      expect(typeof vmu.getEcs('clusterName')).to.equal('string');
    });
    
    it('should return a string when given an sshKeys param', () => {
      expect(typeof vmu.getEcs('clusterName', ['key'])).to.equal('string');
    });
  });
});

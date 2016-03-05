'use strict';

const rewire = require('rewire');

const sg = rewire('./security-group-user-id-group-pair');
const C = require('../../chai');

function initData() {
}


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: EC2: Security Group ID Group Pair', () => {

  beforeEach(initData);

  describe('create function', () => {
    it('should throw without a groupId', () => {
      expect(() => sg.create()).to.throw(TypeError);
    });

    it('should return a new SgUserIdGroupPair', () => {
      expect(sg.create('test') instanceof sg.SgUserIdGroupPair).to.be.ok;
    });
  });
});

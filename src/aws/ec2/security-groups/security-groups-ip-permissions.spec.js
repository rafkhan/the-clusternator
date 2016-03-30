'use strict';

const rewire = require('rewire');

const sg = rewire('./security-groups-ip-permissions');
const C = require('../../../chai');

function initData() {
}


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: EC2: Security Group IP Permissions', () => {

  beforeEach(initData);

  describe('validateProtocol function', () => {
    it('should throw if given an invalid protocol', () => {
      expect(() => sg.SgIpPermissions.validateProtocol('archie'))
        .to.throw(TypeError);
    });
    it('should return true if given a valid protocol', () => {
      expect(sg.SgIpPermissions.validateProtocol('tcp')).to.be.ok;
    });

  });

  describe('validatePort function', () => {
    it('should throw if given a number less than 1', () => {
      expect(() => sg.SgIpPermissions.validatePort(0)).to.throw(TypeError);
    });

    it('should throw if given a number greater than 65535', () => {
      expect(() => sg.SgIpPermissions.validatePort(65536))
        .to.throw(TypeError);
    });

    it('should return valid port numbers', () => {
      expect(sg.SgIpPermissions.validatePort(443)).to.equal(443);
    });
  });

  describe('detectSgRangeOrIp function', () => {
    it('should throw if given an unknown type', () => {
      expect(() => sg.SgIpPermissions.detectIpRangeOrSg({}))
        .to.throw(TypeError);
    });
    
    it('should return ip if given a CidrIp', () => {
      expect(sg.SgIpPermissions.detectIpRangeOrSg({ CidrIp: '1' }))
        .to.equal('ip');
    });

    it('should return sg if given a GroupId', () => {
      expect(sg.SgIpPermissions.detectIpRangeOrSg({ GroupId: 't' }))
        .to.equal('sg');
    });
  });

  describe('reduceIpRangeOrSgs', () => {
    it('should throw if current\'s type does not match previous\'s type',
      () => {
        expect(() => sg.SgIpPermissions.reduceIpRangeOrSgs( {
          GroupId: 't'
        }, {
          CidrIp: '1'
        })).to.throw(TypeError);
      });
    
    it('should provide its own initial value', () => {
      expect(sg.SgIpPermissions.reduceIpRangeOrSgs(null, { GroupId: 't'}))
        .to.be.ok;
    });

    it('should return prev\'s type assuming it matches current\'s type', () => {
      expect(sg.SgIpPermissions.reduceIpRangeOrSgs('sg', {
        GroupId: 't'
      })).to.be.ok;
      expect(sg.SgIpPermissions.reduceIpRangeOrSgs('ip', {
        CidrIp: 'hello'
      })).to.be.ok;
    });

  });

  describe('validateIpRangeOrSgs function', () => {
    it('should throw if not given an array', () => {
      expect(() => sg.SgIpPermissions.validateIpRangeOrSgs('cave'))
        .to.throw(TypeError);
    });

    it('should return the reduction of its array', () => {
      expect(sg.SgIpPermissions.validateIpRangeOrSgs([
        { CidrIp: 't' }, { CidrIp: 'g' }
      ])).to.equal('ip');
    });
  });

  describe('create function', () => {
    it('s returned object should have an IpRanges property if given ip ranges',
      () => {
        const s = sg.create('tcp', 80, 80, [{ CidrIp: 't' }]);
        expect(s.IpRanges).to.be.ok;
      });

    it('s returned object should have a UserIdGroupPairs property if given ' +
      'GroupIds', () => {
        const s = sg.create('tcp', 80, 80, [{ GroupId: 't' }]);
        expect(s.UserIdGroupPairs).to.be.ok;
      });
  });
});

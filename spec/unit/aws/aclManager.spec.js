'use strict';

var rewire = require('rewire'),
  constants = require('../../../src/constants'),
  ec2Mock = require('./ec2-mock');

var Acl = rewire('../../../src/aws/aclManager');
require('../chai');


/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions: 0*/
describe('aclManager', function() {
  var acl;

  beforeEach(function() {
    acl = Acl(ec2Mock, 'vpc-id');
  });

  it('create will throw without a projectId', function() {
    try {
      acl.create();
      expect('this should not happen').to.not.be;
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  });

  it('destroy will throw without a projectId', function() {
    try {
      acl.destroy();
      expect('this should not happen').to.not.be;
    } catch (err) {
      expect(err instanceof Error).to.be.true;
    }
  });

  describe('createNetworkAclEntry tests', function() {
    var callCount, oldFn;
    beforeEach(function() {
      oldFn = ec2Mock.createNetworkAclEntry;
      callCount = 0;
      ec2Mock.createNetworkAclEntry = function(param, cb) {
        callCount += 1;
        cb(null);
      }
    });

    afterEach(function() {
      ec2Mock.createNetworkAclEntry = oldFn;
    });

    it('defaultInOutRules should create two network entries', function(done) {
      acl.defaultInOutRules('test').then(function() {
        expect(callCount).to.equal(2);
        done();
      }, function(err) {
        expect(err).to.not.be;
        done();
      });
    });

  });
});

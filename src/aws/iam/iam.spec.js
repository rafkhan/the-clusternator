'use strict';

const sinon = require('sinon');
const rewire = require('rewire');
const Q = require('q');
const R = require('ramda');

const C = require('chai');
const chaiAsPromised = require('chai-as-promised');
C.use(chaiAsPromised);

/*global describe, it, expect, beforeEach, afterEach */

const iamMock = {
  iam: {
    createRole: Q.resolve,
    putRolePolicy: Q.resolve,
    createInstanceProfile: Q.resolve,
    addRoleToInstanceProfile: Q.resolve,
    listRoles: Q.resolve
  }
};

const t = () => true;
const f = () => false;
const getIam = () => {
  const rwIam = rewire('./iam');
  rwIam.__set__('hasRole', f);
  return rwIam; 
};

describe('IAM', () => {
  describe('createInstanceRole', () => {

    it('should reject with missing name', () => {
      const iam = getIam();
      return expect(iam.createInstanceRole(iamMock)).to.be.rejected;
    });

    it('should reject with missing roleDoc', () => {
      const iam = getIam();
      return expect(iam.createInstanceRole(iamMock, 'name')).to.be.rejected;
    });

    it('should reject with missing policyDoc', () => {
      const iam = getIam();
      return expect(iam.createInstanceRole(iamMock, 'name', {}))
        .to.be.rejected;
    });

    it('should reject on failed createRole', () => {
      const iam = getIam();
      let mock = R.clone(iamMock);
      mock.iam.createRole = Q.reject;
      return expect(iam.createInstanceRole(mock, 'name', {}, {}))
        .to.be.rejected;
    });

    it('should reject on failed putRolePolicy', () => {
      const iam = getIam();
      let mock = R.clone(iamMock);
      mock.iam.putRolePolicy = Q.reject;
      return expect(iam.createInstanceRole(mock, 'name', {}, {}))
        .to.be.resolved;
    });

    it('should reject on failed createInstanceProfile', () => {
      const iam = getIam();
      let mock = R.clone(iamMock);
      mock.iam.createInstanceProfile = Q.reject;
      return expect(iam.createInstanceRole(mock, 'name', {}, {}))
        .to.be.rejected;
    });

    it('should reject addRoleToInstanceProfile', () => {
      const iam = getIam();
      let mock = R.clone(iamMock);
      mock.iam.addRoleToInstanceProfile = Q.reject;
      return expect(iam.createInstanceRole(mock, 'name', {}, {}))
        .to.be.rejected;
    });

    it('should not attempt to create role if it already exists', (done) => {
      const iam = getIam();
      const spy =  sinon.spy();
      iam.__set__('hasRole', t);
      iam.__set__('createRolePolicies', spy);
      iam.createInstanceRole(iamMock, 'name', {}, {})
        .then(() => {
          if(!spy.called) {
            done();
          } else {
            done(new Error('createRolePolicies was called'));
          }
        });
    });

    it('should attempt to create role if it does not exist', (done) => {
      const iam = getIam();
      const spy =  sinon.spy();
      iam.__set__('hasRole', f);
      iam.__set__('createRolePolicies', spy);
      iam.createInstanceRole(iamMock, 'name', {}, {})
        .then(() => {
          if(spy.called) {
            done();
          } else {
            done(new Error('createRolePolicies was not called'));
          }
        });
    });
  });
});

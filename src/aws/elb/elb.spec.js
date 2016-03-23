'use strict';

const rewire = require('rewire');
const Q = require('q');

const elb = rewire('./elb');
const C = require('../../chai');

const aws = {};

function initData() {
  aws.elb = {
    configureHealthCheck: () => Q.resolve(true),
    createLoadBalancer: () => Q.resolve({ DNSName: 'test' }),
    deleteLoadBalancer: () => Q.resolve(true),
    describeLoadBalancers: () => Q.resolve({ LoadBalancerDescriptions: [
      { DNSName: 'test' }
    ]}),
    registerInstancesWithLoadBalancer: () => Q.resolve(true),
    deregisterInstancesFromLoadBalancer: () => Q.resolve(true)
  };
}


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: ELB', () => {
  beforeEach(initData);

  describe('configureHealthCheckFunction', () => {
    it('should return a function', () => {
      expect(typeof elb.configureHealthCheck(aws)).to.equal('function');
    });
    it('should resolve if ec2 call resolves', (done) => {
      elb.configureHealthCheck(aws)()
        .then((r) => C.check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
    it('should reject if ec2 call rejects', (done) => {
      aws.elb.configureHealthCheck = () => Q.reject(new Error('test'));
      elb.configureHealthCheck(aws)()
        .then(C.getFail(done), (e) => C
          .check(done, () => expect(e instanceof Error).to.be.ok));
    });
  });

  describe('elbDeploymentId function', () => {
    it('should be less than 32 chars', () => {
      expect(elb.helpers.elbDeploymentId(
          '1345678901234567', '12345678901234567').length < 32).to.be.ok;
    });

    it('should strip non-alpha-numeric characters', () => {
      expect(elb.helpers.elbDeploymentId(
          'a%&*@', '(&*(b*(*') === 'a-b').to.be.ok;
    });
  });

  describe('elbPrId function', () => {
    it('should be less than 32 chars', () => {
      expect(elb.helpers.elbPrId(
          '1345678901234567', '12345678901234567').length < 32).to.be.ok;
    });

    it('should strip non-alpha-numeric characters', () => {
      expect(elb.helpers.elbPrId(
          'a%&*@', '(&*(b*(*') === 'a-pr-b').to.be.ok;
    });
  });

  describe('defaultListeners function', () => {
    it('should return an Array', () => {
      expect(Array.isArray(elb.helpers.defaultListeners())).to.be.ok;
    });
  });

  describe('create function', () => {
    it('should resolve a promise', (done) => {
      elb.create(aws)().then((r) => C
        .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('createDeployment function', () => {
    it('should throw without a deployment name', () => {
      expect(() => elb.createDeployment(aws, 'test')).to.throw(TypeError);
    });

    it('should throw without a project name', () => {
      expect(() => elb.createDeployment(aws)).to.throw(TypeError);
    });

    it('should resolve a promise', (done) => {
      elb.createDeployment(aws, 'test', 'master')().then((r) => C
        .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('createPr function', () => {
    it('should throw without a pr number', () => {
      expect(() => elb.createPr(aws, '23')).to.throw(TypeError);
    });

    it('should throw without a project name', () => {
      expect(() => elb.createPr(aws)).to.throw(TypeError);
    });

    it('should resolve a promise', (done) => {
      elb.createPr(aws, 'test', '76')().then((r) => C
        .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('destroy function', () => {
    it('should throw without an elbId', () => {
      expect(() => elb.destroy(aws)).to.throw(TypeError);
    });

    it('should resolve a promise', (done) => {
      elb.destroy(aws, 'test')().then((r) => C
        .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('destroyPr function', () => {
    it('should throw without a pr number', () => {
      expect(() => elb.destroyPr(aws, '23')).to.throw(TypeError);
    });

    it('should throw without a project name', () => {
      expect(() => elb.destroyPr(aws)).to.throw(TypeError);
    });

    it('should resolve a promise', (done) => {
      elb.destroyPr(aws, 'test', '1')().then((r) => C
        .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('destroyDeployment function', () => {
    it('should throw without a pr number', () => {
      expect(() => elb.destroyDeployment(aws, '23')).to.throw(TypeError);
    });

    it('should throw without a project name', () => {
      expect(() => elb.destroyDeployment(aws)).to.throw(TypeError);
    });

    it('should resolve a promise', (done) => {
      elb.destroyDeployment(aws, 'test', 'master')().then((r) => C
        .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('describeAll function', () => {
    it('should return a function', () => {
      expect(typeof elb.describeAll(aws)).to.equal('function');
    });
    
    it('should resolve a promise', (done) => {
      elb.describeAll(aws)().then((r) => C
        .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('describeById function', () => {
    it('should return a function', () => {
      expect(typeof elb.helpers.describeById(aws)).to.equal('function');
    });
    
    it('should resolve a promise if it has a result set', (done) => {
      elb.helpers.describeById(aws)().then((r) => C
        .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });

    it('should reject a promise if it has no result set', (done) => {
      aws.elb.describeLoadBalancers = () => Q.resolve({
        LoadBalancerDescriptions: [] });
      elb.helpers.describeById(aws)().then(C.getFail(done), (e) => C
        .check(done, () => expect(e instanceof Error).to.be.ok));
    });
  });

  describe('describeDeployment function', () => {
    it('should throw without a pr number', () => {
      expect(() => elb.describeDeployment(aws, '23')).to.throw(TypeError);
    });

    it('should throw without a project name', () => {
      expect(() => elb.describeDeployment(aws)).to.throw(TypeError);
    });

    it('should resolve a promise', (done) => {
      elb.describeDeployment(aws, 'test', 'master')().then((r) => C
        .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('describePr function', () => {
    it('should throw without a pr number', () => {
      expect(() => elb.describePr(aws, '23')).to.throw(TypeError);
    });

    it('should throw without a project name', () => {
      expect(() => elb.describePr(aws)).to.throw(TypeError);
    });

    it('should resolve a promise', (done) => {
      elb.describePr(aws, 'test', '1')().then((r) => C
        .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('registerInstances function', () => {
    it('should throw without an instances array', () => {
      expect(() => elb.registerInstances(aws, 'test', 5)).to.throw(TypeError);
    });
    
    it('should throw without an instance name', () => {
      expect(() => elb.registerInstances(aws)).to.throw(TypeError);
    });

    it('should resolve if its ec2 call resolves', (done) => {
      elb.registerInstances(aws, 'test', [{ InstanceId: 'test' }])()
        .then((r) => C.check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });
  
  describe('deRegisterInstances function', () => {
    it('should throw without an instances array', () => {
      expect(() => elb.deRegisterInstances(aws, 'test', 5)).to.throw(TypeError);
    });

    it('should throw without an instance name', () => {
      expect(() => elb.deRegisterInstances(aws)).to.throw(TypeError);
    });

    it('should resolve if its ec2 call resolves', (done) => {
      elb.deRegisterInstances(aws, 'test', [{ InstanceId: 'test' }])()
        .then((r) => C.check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

});

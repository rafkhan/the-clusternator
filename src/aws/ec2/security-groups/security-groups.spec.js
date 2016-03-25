'use strict';

const Q = require('q');
const rewire = require('rewire');

const sg = rewire('./security-groups');
const C = require('../../../chai');

const aws = {};

function initData() {
  aws.vpcId = 'vpcId';
  aws.ec2 = {
    authorizeSecurityGroupIngress: () => Q.resolve(true),
    authorizeSecurityGroupEgress: () => Q.resolve(true),
    createSecurityGroup: () => Q.resolve({ GroupId: 'groupId-sg' }),
    createTags: () => Q.resolve(true),
    deleteSecurityGroup: () => Q.resolve(true),
    describeSecurityGroups: () => Q.resolve({
      SecurityGroups: [{ GroupId: 'groupId' }]
    })
  };
}


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: EC2: Security Group IP Permissions', () => {

  beforeEach(initData);

  describe('authorizeIngress function', () => {
    it('should throw without an ipPermissions array', () => {
      expect(() => sg.authorizeIngress(aws, 't')).to.throw(TypeError);
    });
    
    it('should call ec2.authorozieSecurityGroupIngress', (done) => {
      sg.authorizeIngress(aws, 't', [])()
        .then((r) => C
          .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('authorizeEgress function', () => {
    it('should throw without an ipPermissions array', () => {
      expect(() => sg.authorizeEgress(aws, 't')).to.throw(TypeError);
    });

    it('should call ec2.authorozieSecurityGroupEgress', (done) => {
      sg.authorizeEgress(aws, 't', [])()
        .then((r) => C
          .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('create function', () => {
    it('should call ec2.createSecurityGroup', (done) => {
      sg.create(aws, 'group', 'desc')()
        .then((r) => C
          .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('createPr function', () => {
    it('should resolve existing security groups first', (done) => {
      sg.createPr(aws, 'project', '23')()
        .then((r) => C
          .check(done, () => expect(r).to.equal('groupId')), C.getFail(done));
    });

    it('should create new groups if they don\'t exist', (done) => {
      aws.ec2.describeSecurityGroups = () => Q.resolve({ SecurityGroups: [] });
      sg.createPr(aws, 'project', '23')()
        .then((r) => C
          .check(done, () => expect(r).to.equal('groupId-sg')),
          C.getFail(done));
    });
  });

  describe('createDeployment function', () => {
    it('should resolve existing security groups first', (done) => {
      sg.createDeployment(aws, 'project', 'betta')()
        .then((r) => C
          .check(done, () => expect(r).to.equal('groupId')), C.getFail(done));
    });

    it('should create new groups if they don\'t exist', (done) => {
      aws.ec2.describeSecurityGroups = () => Q.resolve({ SecurityGroups: [] });
      sg.createDeployment(aws, 'project', 'beta')()
        .then((r) => C
          .check(done, () => expect(r).to.equal('groupId-sg')),
          C.getFail(done));
    });
  });

  describe('destroy function', () => {
    it('should call ec2.deleteSecurityGroup', (done) => {
      sg.destroy(aws, 'group')()
        .then((r) => C
          .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('destroyPr function', () => {
    it('should call ec2.deleteSecurityGroup if the deployment exists',
      (done) => {
        sg.destroyPr(aws, 'projectId', 'pr')()
          .then((r) => C
            .check(done, () => expect(r).to.be.ok), C.getFail(done));
      });

    it('should not call ec2.deleteSecurityGroup if the deployment is already ' +
      'deleted', (done) => {
        aws.ec2.describeSecurityGroups = () => Q.resolve({ SecurityGroups: []});
        sg.destroyPr(aws, 'projectId', 'pr')()
          .then((r) => C
            .check(done, () => expect(r).to.be.ok), C.getFail(done));
      });
  });

  describe('destroyDeployment function', () => {
    it('should call ec2.deleteSecurityGroup if the deployment exists',
      (done) => {
        sg.destroyDeployment(aws, 'projectId', 'master')()
          .then((r) => C
            .check(done, () => expect(r).to.be.ok), C.getFail(done));
      });

    it('should not call ec2.deleteSecurityGroup if the deployment is already ' +
      'deleted', (done) => {
      aws.ec2.describeSecurityGroups = () => Q.resolve({ SecurityGroups: []});
      sg.destroyDeployment(aws, 'projectId', 'beta')()
        .then((r) => C
          .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });


  describe('describe function', () => {
    it('should call ec2.describeSecurityGroups', (done) => {
      sg.describe(aws)()
        .then((r) => C
          .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('describe project function', () => {
    it('should call ec2.describeSecurityGroups', (done) => {
      sg.describeProject(aws, 'id')()
        .then((r) => C
          .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('describe pr function', () => {
    it('should call ec2.describeSecurityGroups', (done) => {
      sg.describePr(aws, 'id', 'pr #')()
        .then((r) => C
          .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('describe deployment function', () => {
    it('should call ec2.describeSecurityGroups', (done) => {
      sg.describeDeployment(aws, 'id', 'master')()
        .then((r) => C
          .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('list function', () => {
    it('resolve an array of strings', (done) => {
      sg.list(aws)()
        .then((r) => C
          .check(done, () => expect(typeof r[0]).to.equal('string')),
          C.getFail(done));
    });
  });

  describe('list project function', () => {
    it('resolve an array of strings', (done) => {
      sg.listProject(aws, 'id')()
        .then((r) => C
          .check(done, () => expect(typeof r[0]).to.equal('string')),
          C.getFail(done));
    });
  });

  describe('list pr function', () => {
    it('resolve an array of strings', (done) => {
      sg.listPr(aws, 'id', 'pr #')()
        .then((r) => C
          .check(done, () => expect(typeof r[0]).to.equal('string')),
          C.getFail(done));
    });
  });

  describe('list deployment function', () => {
    it('resolve an array of strings', (done) => {
      sg.listDeployment(aws, 'id', 'master')()
        .then((r) => C
          .check(done, () => expect(typeof r[0]).to.equal('string')),
          C.getFail(done));
    });
  });

  describe('getDeploymentTags function', () => {
    it('returns an array of Ec2Tags', () => {
      const tags = sg.helpers.getDeploymentTags('my-project', 'master');
      expect(Array.isArray(tags)).to.be.ok;
    });
  });

  describe('getPrTags function', () => {
    it('returns an array of Ec2Tags', () => {
      const tags = sg.helpers.getPrTags('my-project', '23');
      expect(Array.isArray(tags)).to.be.ok;
    });
  });

  describe('bindAws function', () => {
    it('should return a copy of the api bound with an aws object', (done) => {
      const s = sg.bindAws(aws);
      s.list()()
        .then((r) => C
          .check(done, () => expect(r).to.be.ok), C.getFail(done));
    });
  });

  describe('tagPrOrDeployment function', () => {
    it('should return a function', () => {
      expect(typeof sg.helpers
        .tagPrOrDeployment(aws, 'project', 'id', 'prOrDeployment', () => {}))
        .to.equal('function');
    });
    
    it('should return a function that returns a promise', () => {
      expect(typeof sg.helpers
        .tagPrOrDeployment(
          aws, 'project', 'id', 'prOrDeployment', () => [])().then)
        .to.equal('function');
    });
  });
});

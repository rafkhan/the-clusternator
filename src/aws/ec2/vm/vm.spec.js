'use strict';

const Q = require('q');
const rewire = require('rewire');

const vm = rewire('./vm');
const C = require('../../../chai');

const aws = {};

function initData() {
  aws.vpcId = 'vpcId';
  aws.ec2 = {
    describeInstances: () => Q.resolve(true),
    runInstances: () => Q.resolve(true),
    stopInstances: () => Q.resolve(true),
    terminateInstances: () => Q.resolve(true)
  };
}


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: EC2: VM (ec2 virtual machines)', () => {

  beforeEach(initData);
  
  describe('create function', () => {
    it('should return a function', () => {
      expect(typeof vm.create(aws, 'sgId', 'subnetId')).to.equal('function');
    });   
    
    it('s returned function should return a promise', () => {
      expect(typeof vm.create(aws, 'sgId', 'subnetId')().then)
        .to.equal('function'); 
    });

    it('s returned function should return a promise when userData present',
      () => {
        expect(typeof vm.create(aws, 'sgId', 'subnetId', 'base64')().then)
          .to.equal('function');
      });
  });

  describe('describe function', () => {
    it('should return a function', () => {
      expect(typeof vm.describe()).to.equal('function');
    });
    
    it('s returned function should return a promise', () => {
      expect(typeof vm.describe(aws)().then).to.equal('function');
    });
  });

  describe('describeDeployment function', () => {
    it('should throw without a deployment name', () => {
      expect(() => vm.describeDeployment(aws, 'project')).to.throw(TypeError); 
    });
    
    it('should throw without a project name', () => {
      expect(() => vm.describeDeployment(aws)).to.throw(TypeError);
    });
    
    it('should return a function', () => {
      expect(typeof vm.describeDeployment(aws, 'project', 'master'))
        .to.equal('function');
    });

    it('s returned function should return a promise', () => {
      expect(typeof vm.describeDeployment(aws, 'project', 'master')().then)
        .to.equal('function');
    });
  });
  
  describe('describePr function', () => {
    it('should throw without a deployment name', () => {
      expect(() => vm.describePr(aws, 'project')).to.throw(TypeError);
    });

    it('should throw without a project name', () => {
      expect(() => vm.describePr(aws)).to.throw(TypeError);
    });

    it('should return a function', () => {
      expect(typeof vm.describePr(aws, 'project', '123'))
        .to.equal('function');
    });

    it('s returned function should return a promise', () => {
      expect(typeof vm.describePr(aws, 'project', '123')().then)
        .to.equal('function');
    });
  });

  describe('describeProject function', () => {
    it('should throw without a project name', () => {
      expect(() => vm.describeProject(aws)).to.throw(TypeError);
    });

    it('should return a function', () => {
      expect(typeof vm.describeProject(aws, 'project')).to.equal('function');
    });

    it('s returned function should return a promise', () => {
      expect(typeof vm.describeProject(aws, 'project')().then)
        .to.equal('function');
    });
  });

  describe('flattenDescriptions function', () => {
    it('should return a list of strings', () => {
      expect(vm.helpers.flattenDescriptions({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'a'
              },
              {
                InstanceId: 'b'
              }
            ] 
          },
          {
            Instances: [
              {
                InstanceId: 'c'
              }
            ] 
          }
        ] 
      })).to.deep.equal(['a', 'b', 'c']);
    });
  });

  describe('list function', () => {
    it('should return a function', () => {
      expect(typeof vm.list()).to.equal('function');
    });
    
    it('s returned function should return a promise', () => {
      expect(typeof vm.list(aws)().then).to.equal('function');
    });
  });
  
  describe('listDeployment function', () => {
    it('should return a function', () => {
      expect(typeof vm.listDeployment()).to.equal('function');
    });

    it('s returned function should return a promise', () => {
      expect(typeof vm.listDeployment(aws, 'project', 'master')().then)
        .to.equal('function');
    });
  });
  
  describe('listPr function', () => {
    it('should return a function', () => {
      expect(typeof vm.listPr()).to.equal('function');
    });

    it('s returned function should return a promise', () => {
      expect(typeof vm.listPr(aws, 'project', 'master')().then)
        .to.equal('function');
    });
  });
  
  describe('listProject function', () => {
    it('should return a function', () => {
      expect(typeof vm.listProject()).to.equal('function');
    });

    it('s returned function should return a promise', () => {
      expect(typeof vm.listProject(aws, 'project')().then).to.equal('function');
    });
  });

  describe('checkInstanceStatuses function', () => {
    it('should throw without an instanceId', () => {
      expect(() => vm.checkInstanceStatuses(aws)).to.throw(TypeError);
    });
    
    it('should throw with an empty array', () => {
      expect(() => vm.checkInstanceStatuses(aws, [])).to.throw(TypeError);
    });
    
    it('should return a function', () => {
      expect(typeof vm.checkInstanceStatuses(aws, 'id')).to.equal('function');
    });
    
    it('s returned function should return a promise', () => {
      const p = vm.checkInstanceStatuses(aws, ['1', '2'])();
      expect(typeof p.then).to.equal('function');
    });
  });

  describe('flattenInstanceStatuses function', () => {
    it('should return an array on invalid results (no result)', () => {
      expect(vm.helpers.flattenInstanceStatuses()).to.deep.equal([]); 
    });
    
    it('should return an array on invalid results (no Reservation)', () => {
      expect(vm.helpers.flattenInstanceStatuses({})).to.deep.equal([]);
    });
    
    it('should return an array on invalid results (no Reservations)', () => {
      expect(vm.helpers.flattenInstanceStatuses({ Reservations: [] }))
        .to.deep.equal([]);
    });

    it('should return an array with objects that have Id, State, and Tags',
      () => {
        const test = { 
          InstanceId: null, 
          State: null,
          Tags: null,
          Other: 'I will be filtered'
        };
        const result = {
          InstanceId: null,
          State: null,
          Tags: null
        };
        expect(vm.helpers.flattenInstanceStatuses({ Reservations: [{
          Instances: test
        }, {
          Instances: test
        }] }))
          .to.deep.equal([result, result]);
      });
  });

  describe('checkForState function', () => {
    it('should return a function', () => {
      expect(typeof vm.helpers.checkForState('running')).to.equal('function');
    });
    
    it('s returned function should return false if its first parameter is ' +
      'falsey', () => {
      const map = vm.helpers.checkForState('running');
      expect(map(false)).to.equal(false);
    });

    it('s returned function should return true if its second parameter has ' +
      'the expected value', () => {
      const map = vm.helpers.checkForState('running');
      expect(map(true, { State: { Name: 'running' } })).to.equal(true); 
    });
  });

  describe('areInstancesAtState function', () => {
    it('should throw if given an empty list', () => {
      expect(() => vm.helpers.areInstancesAtState([], 'running'))
        .to.throw(Error);
    });
    
    it('should throw if all given instances are not running', () => {
      expect(() => vm.helpers.areInstancesAtState([
        {
          State: {
            Name: 'not running'
          }
        } 
      ], 'running')).to.throw(Error);
    });
    
    it('should return true if all given instances are running', () => {
      expect(vm.helpers.areInstancesAtState([
        {
          State: {
            Name: 'running'
          }
        }
      ], 'running')).to.equal(true);
    });
  });

  describe('makeReadyPredicate', () => {
    it('should return a function', () => {
      expect(typeof vm.makeReadyPredicate(aws, 'id')).to.equal('function');
    });
    
    it('s returned function should return a promise', () => {
      const p = vm.makeReadyPredicate(aws, 'id')();
      expect(typeof p.then).to.equal('function');
    });
  });
  
  describe('makeTerminatedPredicate', () => {
    it('should return a function', () => {
      expect(typeof vm.makeTerminatedPredicate(aws, 'id')).to.equal('function');
    });

    it('s returned function should return a promise', () => {
      const p = vm.makeTerminatedPredicate(aws, 'id')();
      expect(typeof p.then).to.equal('function');
    });
  });
  
  describe('waitForReady function', () => {
    it('should return a function', () => {
      expect(typeof vm.waitForReady(aws, 'id')).to.equal('function');
    });

    it('s returned function should return a promise', () => {
      const p = vm.waitForReady(aws, 'id')();
      expect(typeof p.then).to.equal('function');
    });
  });
  
  describe('waitForTermination function', () => {
    it('should return a function', () => {
      expect(typeof vm.waitForTermination(aws, 'id')).to.equal('function');
    });

    it('s returned function should return a promise', () => {
      const p = vm.waitForTermination(aws, 'id')();
      expect(typeof p.then).to.equal('function');
    });
  });

  describe('destroy function', () => {
    it('should throw without an id', () => {
      expect(() => vm.destroy(aws)).to.throw(TypeError);
    });
    
    it('should return a function', () => {
      expect(typeof vm.destroy(aws, 'id')).to.equal('function');
    });
    
    it('s returned function should return a promise', () => {
      const p = vm.destroy(aws, 'id')();
      expect(typeof p.then).to.equal('function');
    });

    it('s returned function should return a promise with an array of ids',
      () => {
        const p = vm.destroy(aws, ['1', '2'])();
        expect(typeof p.then).to.equal('function');
      });
  });
  
  describe('destroyDeployment', () => {
    it('should return a function', () => {
      expect(typeof vm.destroyDeployment(aws, 'project', 'master'))
        .to.equal('function');
    });

    it('s returned function should return a promise', () => {
      const p = vm.destroyDeployment(aws, 'project', 'master')();
      expect(typeof p.then).to.equal('function');
    });
  });
  
  describe('destroyPr', () => {
    it('should return a function', () => {
      expect(typeof vm.destroyPr(aws, 'project', 'master'))
        .to.equal('function');
    });

    it('s returned function should return a promise', () => {
      const p = vm.destroyPr(aws, 'project', 'master')();
      expect(typeof p.then).to.equal('function');
    });
  });

  describe('bindAws function', () => {
    it('should return a copy of the api', () => {
      expect(vm.bindAws(aws)).to.be.ok;
    });
  });
});

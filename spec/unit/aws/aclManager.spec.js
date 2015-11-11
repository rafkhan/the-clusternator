'use strict';

var rewire = require('rewire'),
  Q = require('q'),
  constants = require('../../../src/constants'),
  common = require('../../../src/aws/common'),
  ec2Mock = require('./ec2-mock');

var Acl = rewire('../../../src/aws/aclManager');
var C = require('../chai');


/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions: 0*/
describe('aclManager', () => {
  var acl;

  beforeEach(() => {
    acl = Acl(ec2Mock, 'vpc-id');
  });

  it('create will throw without a projectId', () => {
    expect(() => {
      acl.create();
    }).to.throw(Error);
  });

  it('create should return a promise', (done) => {
    acl.create('my-project').then(() => {
      C.check(done, () => {
        expect(true).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('destroy will throw without a projectId', () => {
    expect(() => {
      acl.destroy();
    }).to.throw(Error);
  });

  it('destroy should return a promise', (done) => {
    acl.destroy('my-project').then(C.getFail(done), () => {
      C.check(done, () => {
        expect(true).to.be.ok;
      });
    });
  });

  describe('test destroy\'s resolving case', () => {
    var oldDesc;
    beforeEach(() => {
      oldDesc = common.makeEc2DescribeFn;
      common.makeEc2DescribeFn = () => {
        return () => {
          return Q.resolve([1, 2, 3]);
        }
      }
      Acl.__set__('common', common);
      // make sure to use a new, new Acl object
      acl = Acl(ec2Mock, 'vpc-id');
    });

    afterEach(() => {
      common.makeEc2DescribeFn = oldDesc;
      Acl.__set__('common', common);
    });

    it('destroy should resolve a promise if acls are found', (done) => {
      acl.destroy('my-project').then(() => {
        C.check(done, () => {
          expect(true).to.be.ok;
        });
      }, C.getFail(done));
    });
  });

  it('throwIfListHasLength should not thow on an empty list', () => {
    expect(() => {
      acl.helpers.throwIfListHasLength([]);
    }).to.not.throw;
  });

  it('throwIfListHasLength should throw if a list has length', () => {
    expect(() => {
      acl.helpers.throwIfListHasLength([1]);
    }).to.throw(Error);
  });

  it('createAcl should return a promise', (done) => {
    acl.helpers.createAcl().then(() => {
      C.check(done, () => {
        expect(true).to.be.ok;
      });
    }, C.getFail(done));
  });

  describe('createNetworkAclEntry tests', () => {
    var callCount, oldFn;
    beforeEach(() => {
      oldFn = ec2Mock.createNetworkAclEntry;
      callCount = 0;
      ec2Mock.createNetworkAclEntry = (param, cb) => {
        callCount += 1;
        cb(null);
      }
      acl = Acl(ec2Mock, 'vpc-id');
    });

    afterEach(() => {
      ec2Mock.createNetworkAclEntry = oldFn;
    });

    it('defaultInOutRules should create two network entries', (done) => {
      acl.helpers.defaultInOutRules('test').then(() => {
        C.check(done, () => {
          expect(callCount).to.equal(2);
        });
      }, C.getFail(done));
    });
  });
});

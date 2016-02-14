'use strict';

const rewire = require('rewire');
const constants = require('../constants');
const ec2Mock = require('./ec2-mock');
const mockFs = require('mock-fs');
const C = require('../chai');

const Ec2 = rewire('./ec2Manager');


/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions: 0*/
describe('ec2Manager', () => {
  let ec2;

  beforeEach(() => {
    ec2 = Ec2(ec2Mock);
    mockFs({
      '.private/publicKeys/': {
        pat: new Buffer([1, 2, 3, 4]),
        sam: new Buffer([2, 3, 4, 5]),
        nick: new Buffer([3, 4, 5, 6])
      }
    });
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('createPr should throw if not given a projectId or pr #', () => {
    expect(() => {
      ec2.createPr();
    }).to.throw(Error);
  });

  it('destroyPr should throw if not given a projectId or pr #', () => {
    expect(() => {
      ec2.destroyPr();
    }).to.throw(Error);
  });

  it('loadUserPublicKeys should resolve a list of strings, given a path ' +
    'that has public key files in it', (done) => {
    ec2.helpers.loadUserPublicKeys('.private/publicKeys').then((keys) => {
      C.check(done, () => {
        keys.forEach((key) => {
          expect(typeof key).to.equal('string');
        });
      });
    }, C.getFail(done));
  });

  it('loadUserPublicKeys should reject if something goes wrong, like missing ' +
    'a file, or path', (done) => {
    ec2.helpers.loadUserPublicKeys('/some/fake/path').
    then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });
  });

  it('makeDockerAuth should throw if its param is missing', () => {
    expect(() => {
      ec2.helpers.makeDockerAuth();
    }).to.throw(TypeError);
  });

  it('makeDockerAuth should throw if its param is missing a username', () => {
    expect(() => {
      ec2.helpers.makeDockerAuth({ password: 't', email: 'e' });
    }).to.throw(TypeError);
  });

  it('makeDockerAuth should throw if its param is missing an email', () => {
    expect(() => {
      ec2.helpers.makeDockerAuth({ password: 't', username: 'u' });
    }).to.throw(TypeError);
  });

  it('makeDockerAuth should throw if its param is missing a password', () => {
    expect(() => {
      ec2.helpers.makeDockerAuth({ email: 'e', username: 'u' });
    }).to.throw(TypeError);
  });

  it('makeDockerAuth should return an array', () => {
    expect(Array.isArray(
      ec2.helpers.makeDockerAuth({ email: 'e', username: 'u', password: 'p' })
      )
    ).to.be.ok;
  });

  it('makeDockerAuthCfg should throw if its param is missing', () => {
    expect(() => {
      ec2.helpers.makeDockerAuthCfg();
    }).to.throw(TypeError);
  });

  it('makeDockerAuthCfg should return an array', () => {
    expect(Array.isArray(
      ec2.helpers.makeDockerAuthCfg('some-auth-string')
    )).to.be.ok;
  });

  it('processSSHKeys should return an empty array if given an empty array',
    () => {
      expect(ec2.helpers.processSSHKeys([]).toString()).to.equal([].toString());
    });

  it('processSSHKeys should return an array with SETUP_SSH at element 0',
    () => {
      expect(ec2.helpers.processSSHKeys(['test'])[0]).
      to.equal(ec2.helpers.SETUP_SSH);
    });

  it('processSSHKeys should return an array with CHOWN_SSH as the last element',
    () => {
      expect(ec2.helpers.processSSHKeys(['test'])[2]).
      to.equal(ec2.helpers.CHOWN_SSH);
    });

  it('processSSHKeys should prefix SSH keys with an echo "', () => {
    expect(
      ec2.helpers.processSSHKeys(['test'])[1].indexOf('echo "\n')
    ).to.equal(0);
  });

  it('processSSHKeys should postfix SSH keys with a " OUTPUT_SSH ', () => {
    const result = ec2.helpers.processSSHKeys(['test'])[1];
    const expected = '" ' + ec2.helpers.OUTPUT_SSH;
    expect(
      result.indexOf(expected)
    ).to.equal(result.length - expected.length);
  });

  it('makeSSHUserData should return a promise', () => {
    expect(typeof ec2.helpers.makeSSHUserData('t').then).to.equal('function');
  });

  it('stringArrayToNewLineBase64 should return a base64 string with newlines' +
    'between elements', () => {
    expect(
      ec2.helpers.stringArrayToNewLineBase64(['a', 'b']).toString()
    ).to.equal('YQpi');
  });

  it('getECSContainerData should return a promise', () => {
    expect(
      typeof ec2.helpers.getECSContainerInstanceUserData(
        'a', { cfg: 'b' }, 'c'
      ).then
    ).to.equal('function');
  });

  it('checkInstanceStatuses should return a promise', () => {
    expect(
      typeof ec2.helpers.checkInstanceStatuses('t').then
    ).to.equal('function');
  });

  it('makeTerminatedPredicate should return a function',() => {
    expect(
      typeof ec2.helpers.makeTerminatedPredicate('t')
    ).to.equal('function');
  });

  it('makeTerminatedPredicate should return a promising function',() => {
    expect(
      typeof ec2.helpers.makeTerminatedPredicate('t')().then
    ).to.equal('function');
  });

  it('makeReadyPredicate should return a function',() => {
    expect(
      typeof ec2.helpers.makeReadyPredicate('t')
    ).to.equal('function');
  });

  it('makeReadyPredicate should return a promising function',() => {
    expect(
      typeof ec2.helpers.makeReadyPredicate('t')().then
    ).to.equal('function');
  });
});

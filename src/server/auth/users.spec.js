'use strict';

const C = require('../../chai');
const rewire = require('rewire');
const users = rewire('./users');
const Q = require('q');

/*global describe, it, expect, beforeEach, afterEach */
describe('Users interface', function() {
  /** Make sure `this` is in traditional function, _not_ an arrow */
  this.timeout(10000);

  const dbs = { passwords: () => {}, authorities: () => {}};
  let testUser1;
  let testUser2;
  let testUser3;
  let testUser4;
  let testUser5;
  let oldTokens;
  let oldPasswords;
  let oldAuthorities;
  let tokens;
  let passwords;
  let authorities;

  function setup() {
    tokens = {
      findById: () => Q.resolve(),
      create: () => Q.resolve()
    };
    passwords = {
      change: () => Q.resolve(),
      create: () => Q.resolve(),
      find: () => Q.resolve()
    };
    authorities = {
      create: (db, id, authority) => Q.resolve({ id, authority }),
      find: () => Q.resolve()
    };
  }

  beforeEach((done) => {
    testUser1 = {id: 'test', password: '123456789ABCD'};
    testUser2 = {id: 'test2', password: '123456789ABCD'};
    testUser3 = {id: 'test3', password: '123456789ABCDE'};
    testUser4 = {id: 'test4', password: '123456789ABCDEF', authority: 2 };
    testUser5 = {id: 'test5', password: '12'};
    oldTokens = users.__get__('tokens');
    oldPasswords = users.__get__('passwords');
    oldAuthorities = users.__get__('authorities');
    setup();
    users.__set__('tokens', tokens);
    users.__set__('passwords', passwords);
    users.__set__('authorities', authorities);
    return users.init({ passwords, authorities }).then(done, C.getFail(done));
  });

  afterEach(() => {
    users.__set__('tokens', oldTokens);
    users.__set__('passwords', oldPasswords);
    users.__set__('authorities', oldAuthorities);
  });

  it('createUser should reject a new user object *with* a short password',
    (done) => {
      users.create(testUser5).then((newU) => C.getFail(done), () => {
        C.check(() => {
          expect(testUser1.password).to.not.be.ok;
        }, done);
      });
    });

  it('createUser should resolve a new user object *without* a password field',
    (done) => {
      passwords.find = () => Q.reject(new Error('test'));
      users.create(testUser1).then((newU) => {
        C.check(done, () => {
          expect(testUser1.password).to.not.be.ok;
        });
      }, C.getFail(done));
    });

  it('createUser should resolve a new user object *with* an authority field',
    (done) => {
      passwords.find = () => Q.reject(new Error('test'));
      users.create(testUser4).then((newU) => {
        C.check(done, () => {
          expect(newU.authority).to.equal(2);
        });
      }, C.getFail(done));
    });

  it('createUser should remove password field from original object',
    (done) => {
      passwords.find = () => Q.reject(new Error('test'));
      users.create(testUser2).then(() => {
        C.check(done, () => {
          expect(testUser2.password).to.not.be.ok;
        });
      }, C.getFail(done));
    });

  it('createUser should reject with no password', (done) => {
    passwords.find = () => Q.reject(new Error('test'));
    users.create({id: 'stuff'}).then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });
  });

  it('createUser should reject with no id', (done) => {
    users.create({password: 'stuff'}).then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });
  });

  it('createUser should reject with no input', (done) => {
    users.create().then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });
  });

  it('createUser should reject if it has the entry', (done) => {
    users.create(testUser1).then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });
  });
});

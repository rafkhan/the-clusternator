'use strict';
/*global describe, it, expect, require, beforeEach */

describe('Passwords interface', () => {
  var C = require('../../chai'),
    authorities = require('../../../../src/server/auth/authorities'),
    testId = 'blah', mgr = 'manager', reg = 'regular', admin = 'admin';

  it('find should retrieved created authorities, that have an "authority"',
    (done) => {
      authorities.create(testId, reg).then(() => {
        return authorities.find(testId).then((test) => {
          C.check(done, () => {
            expect(test.authority).to.be.ok;
          });
        });
      }).fail(C.getFail(done));
    });

  it('create should default to regular authority', (done) => {
    var testId2 = 'hhhh';
    authorities.create(testId2).then(() => {
      return authorities.find(testId2).then((test) => {
        C.check(done, () => {
          expect(test.authority).to.equal(reg);
        });
      });
    }).fail(C.getFail(done));
  });

  it('change authorities should resolve if the id exists', (done) => {
    authorities.change(testId, mgr).then(() => {
      return authorities.find(testId).then((a) => {
        C.check(done, () => {
          expect(a.authority).to.equal(mgr);
        });
      });
    }, C.getFail(done));
  });

  it('change authorities should reject if given an invalid id', (done) => {
      authorities.change('ooga', reg).then(C.getFail(done), (err) => {
        C.check(done, () => {
          expect(err instanceof Error).to.be.ok;
        });
      });
    });
});

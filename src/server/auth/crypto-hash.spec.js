'use strict';

/*global describe, it, expect */
/*eslint no-unused-expressions:0*/
describe('Crypto Hash wraps credential', function () {
  // for this.timeout to work this describe block CANNOT use an arrow
  this.timeout(10000);
  const C = require('../../chai');
  const hash = require('./crypto-hash');
  const pass = 'test me I am secret';

  it('verify should fail if passwords mismatch', (done) => {
    hash.saltHash(pass).then((shash) => {
      hash.verify(shash, 'something else').
      then(C.getFail(done), (err) => {
        C.check(done, () => {
          expect(err instanceof Error).to.be.ok;
        });
      });
    });
  });

  it('verify should succeed if passwords match', (done) => {
    hash.saltHash(pass).then((shash) => {
      hash.verify(shash, pass).then((r) => {
        C.check(done, () => {
          expect(r).to.be.ok;
        });
      }, C.getFail(done));
    });
  });

  it('verify should reject if credential errors', (done) => {
    hash.verify(pass, pass).then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });
  });
});

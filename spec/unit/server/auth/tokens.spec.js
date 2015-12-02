'use strict';

/*global describe, it, expect */
/*eslint no-unused-expressions:0*/
describe('Passwords interface', function () {
  // for this.timeout to work this describe block CANNOT use an arrow
  this.timeout(10000);
  var C = require('../../chai'),
    tokens = require('../../../../src/server/auth/tokens');

  it('find should resolve an array', (done) => {
    tokens.find('some id').then((results) => {
      C.check(done, () => {
        expect(Array.isArray(results)).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('create should resolve a new token', (done) => {
    tokens.create('some id').then((token) => {
      C.check(done, () => {
        expect(typeof token === 'string').to.be.ok;
      });
    }, C.getFail(done));
  });

  it('created tokens should be validatable', (done) => {
    tokens.create('some id').then((token) => {
      return tokens.verify('some id', token).then((index) => {
        C.check(done, () => {
          expect(typeof index === 'number').to.be.ok;
        });
      });
    }, C.getFail(done));
  });

  it('created tokens should be invalidatable', (done) => {
    tokens.create('some id').then((token) => {
      return tokens.invalidate('some id', token).then(() => {
        return tokens.verify('some id', token).then(C.getFail(done), (err) => {
          C.check(done, () => {
            expect(err instanceof Error).to.be.ok;
          });
        });
      });
    });
  });

});

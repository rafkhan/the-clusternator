'use strict';

/*global describe, it, expect */
/*eslint no-unused-expressions:0*/
describe('Tokens interface', function () {
  // for this.timeout to work this describe block CANNOT use an arrow
  this.timeout(10000);
  const C = require('../../chai');
  const tokens = require('./tokens');

  it('findById should resolve an array', (done) => {
    tokens.findById('some id').then((results) => {
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

  it('created tokens should be prefixed with a user id and a colon', (done) => {
    tokens.create('some id').then((token) => {
      C.check(done, () => {
        expect(token.indexOf('some id:')).to.equal(0);
      });
    }, C.getFail(done));
  });

  it('created tokens should be validatable', (done) => {
    tokens.create('some id').then((token) => {
      return tokens.verify(token).then((index) => {
        C.check(done, () => {
          expect(typeof index === 'number').to.be.ok;
        });
      });
    }, C.getFail(done));
  });

  it('created tokens should be invalidatable', (done) => {
    tokens.create('some id').then((token) => {
      return tokens.invalidate(token).then(() => {
        return tokens.verify(token).then(C.getFail(done), (err) => {
          C.check(done, () => {
            expect(err instanceof Error).to.be.ok;
          });
        });
      });
    });
  });

  it('userFromToken should return a user id from a token', () => {
    expect(tokens.userFromToken('me:23523k5j2k35j2')).to.equal('me');
  });

});

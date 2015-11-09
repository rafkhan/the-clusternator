'use strict';
var util = require('../../src/util'),
  Q = require('q');
require('./chai');



/*global describe, it, expect */
/*eslint no-unused-expressions:0*/
describe('utility functions', function() {
  it('should have a function that quotes a supplied argument', function() {
    expect(util.quote('booya')).equal('"booya"');
  });

  it('getCidrPrefixFromIPString should return the first two classes of an ' +
    ' ip address',
    function() {
      expect(util.getCidrPrefixFromIPString('1.2.3.4')).to.equal('1.2');
    });

  it('plog should return the first argument', function() {
    expect(util.plog(2)).to.equal(2);
  })

  it('errLog should return a broken promsie', function(done) {
    var output = 'hahhahah';
    util.errLog(output).then(function() {
      expect('this case should not happen').to.equal(undefined);
      done();
    }, function(err) {
      expect(err.message).to.equal(output);
      done();
    });
  });

  describe('waitFor tests', function() {
    it('waitFor should resolve if its predicate resolves', function(done) {
      function predicate() {
        return Q.resolve();
      }
      util.waitFor(predicate, 1, 1, 'test').then(function() {
        expect(true).to.be;
        done();
      }, function(err) {
        expect(err).to.not.be;
        done();
      });
    });


    it('waitFor should reject if its predicate rejects, *and* max retries ' +
      ' exceeded',
      function(done) {
        function predicate() {
          return Q.reject(new Error('test'));
        }
        util.waitFor(predicate, 1, 1, 'test').then(function() {
          expect('not this case').to.not.be;
          done();
        }, function(err) {
          expect(err instanceof Error).to.be;
          done();
        });
      });


    it('waitFor should reseolve if its predicate resolves, *and* max retries ' +
      ' is *not* exceeded',
      function(done) {
        var count = 0;

        function predicate() {
          count += 1;
          if (count < 5) {
            return Q.reject(new Error('test'));
          } else {
            return Q.resolve();
          }
        }
        util.waitFor(predicate, 1, 6, 'test').then(function() {
          expect(true).to.be;
          done();
        }, function(err) {
          expect(err).to.not.be;
          done();
        });
      });
  });
});

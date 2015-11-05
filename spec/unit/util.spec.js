'use strict';

var util = require('../../src/util');
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
});

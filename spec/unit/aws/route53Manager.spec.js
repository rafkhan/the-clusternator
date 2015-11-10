'use strict';

var rewire = require('rewire'),
  mockR53 = require('./route53-mock'),
  constants = require('../../../src/constants');

var Route53 = rewire('../../../src/aws/route53Manager');
require('../chai');

/*global describe, it, expect, beforeEach */
/*eslint no-unused-expressions: 0*/
describe('route53Manager', function() {
  var route53;

  beforeEach(function() {
    route53 = Route53(mockR53, 'someZone');
  });

  describe('helper functions', function() {
    it('validateResourceRecordSetType should default to \'A\' records',
      function() {
        expect(route53.helpers.validateResourceRecordSetType()).to.equal('A');
      });

    it('createResourceRecordSet should throw without first parameter (name)',
      function() {
        try {
          route53.helpers.createResourceRecordSet();
          expect('this should not happen').to.not.be;
        } catch (err) {
          expect(err instanceof Error).to.be;
        }
      });

    it('createResourceRecord should throw without first parameter (value)',
      function() {
        try {
          route53.helpers.createResourceRecord();
          expect('this should not happen').to.not.be;
        } catch (err) {
          expect(err instanceof Error).to.be;
        }
      });

    it('createResourceRecord should return an object like { Value: value }',
      function() {
        var rr = route53.helpers.createResourceRecord('stuff');
        expect(rr.Value).to.equal('stuff');
      });

    it('findTld should return the mock tld (example.com.)', function(done) {
      route53.helpers.findTld().then(function(tld) {
        expect(tld).to.equal('example.com.');
        done();
      }, function(err) {
        expect(err).to.not.be;
        done();
      });
    });
  });
});

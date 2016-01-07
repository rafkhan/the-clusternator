'use strict';

var rewire = require('rewire'),
  mockR53 = require('./route53-mock'),
  constants = require('../../../src/constants');

var Route53 = rewire('../../../src/aws/route53Manager'),
  C = require('../chai');

/*global describe, it, expect, beforeEach */
/*eslint no-unused-expressions: 0*/
describe('route53Manager', () => {
  var route53;

  beforeEach(() => {
    route53 = Route53(mockR53, 'someZone');
  });

  it('findId should return a promise', (done) => {
    route53.findId().then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.true;
      });
    });
  });

  describe('helper functions', () => {
    it('validateResourceRecordSetType should default to \'A\' records', () => {
      expect(route53.helpers.validateResourceRecordSetType()).to.equal('A');
    });

    it('createResourceRecordSet should throw without first parameter (name)', () => {
      expect(() => {
        route53.helpers.createResourceRecordSet();
      }).to.throw(Error);
    });

    it('createResourceRecordSet should create a ResourceRecord from param ' +
      'three', () => {
        var rrst = route53.helpers.createResourceRecordSet('name', 'A',
          '1.2.3.4');
        expect(rrst.ResourceRecords[0].Value).to.equal('1.2.3.4');
      });

    it('createResourceRecord should throw without first parameter (value)', () => {
      expect(() => {
        route53.helpers.createResourceRecord();
      });
    });

    it('createResourceRecord should return an object like { Value: value }', () => {
      var rr = route53.helpers.createResourceRecord('stuff');
      expect(rr.Value).to.equal('stuff');
    });

    it('findTld should return the mock tld (example.com.)', (done) => {
      route53.helpers.findTld().then((tld) => {
        C.check(done, () => {
          expect(tld).to.equal('example.com.');
        });
      }, C.getFail(done));
    });

    it('pluckHostedZoneName should return the HostedZone property\'s name ' +
      'attribute', () => {
        expect(route53.helpers.pluckHostedZoneName({
          HostedZone: {
            Name: 'pat'
          }
        })).to.equal('pat');
      });

    it('createChange throws without a valid action', () => {
      expect(() => {
        route53.helpers.createChange('abflkhaslg');
      }).to.throw(Error);
    });

    it('createChange should return an object with a valid action', () => {
      expect(route53.helpers.createChange('UPSERT').Action).to.equal('UPSERT');
    });

    it('changeChangeBatch should return an object with a given Comment',
      () => {
        expect(
          route53.helpers.createChangeBatch('stuff').Comment
        ).to.equal('stuff');
      })

    it('findFirstTag should find the first matching tag in a "TagSet"', () => {
      var id = route53.helpers.findFirstTag([{
        Tags: []
      }, {
        ResourceId: 'test',
        Tags: [{
          Key: constants.CLUSTERNATOR_TAG
        }]
      }]);
      expect(id).to.equal('test');
    });

    it('pluckId should destructure Id out of an object', () => {
      expect(route53.helpers.pluckId({
        Id: 'test'
      })).to.equal('test');
    });

    it('pluckId should trim "/hostedzone/ from a given Id"', () => {
      expect(route53.helpers.pluckId({
        Id: '/hostedzone/test'
      })).
      to.equal('test');
    });
  });
});

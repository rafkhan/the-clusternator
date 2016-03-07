'use strict';

const rewire = require('rewire');

const ec2 = rewire('./ec2-filter');
const C = require('../../chai');

function initData() {
}


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: EC2: Filter', () => {

  beforeEach(initData);

  describe('create function', () => {
    it('should throw without a second parameter', () => {
      expect(() => ec2.create('test')).to.throw(TypeError);
    });

    it('should throw without a first parameter', () => {
      expect(() => ec2.create(undefined, 'me')).to.throw(TypeError);
    });

    it('should return a new Filter', () => {
      const f = ec2.create('test', 'me');
      expect(f instanceof ec2.Filter).to.be.ok;
    });

    it('s returned object should have a given Name property', () => {
      const f = ec2.create('test', 'me');
      expect(f.Name).to.equal('test');
    });

    it('s returned object should have a Values array', () => {
      const f = ec2.create('test', 'me');
      expect(Array.isArray(f.Values)).to.be.ok;
      expect(f.Values[0]).to.equal('me');
    });

    it('should accept arrays as the second parameter', () => {
      const f = ec2.create('test', ['me']);
      expect(Array.isArray(f.Values)).to.be.ok;
      expect(f.Values[0]).to.equal('me');
    });

  });

  describe('createVpc function', () => {
    it('should return a filter for an AWS vpc-id', () => {
      const f = ec2.createVpc(['me']);
      expect(f.Name).to.equal('vpc-id');
    });
  });

  describe('createTag function', () => {
    it('should return a filter with its name prefixed in a format AWS expects ',
      () => {
        const f = ec2.createTag('test', ['me']);
        expect(f.Name).to.equal('tag:test');
      });
  });

  describe('createTagKey function', () => {
    it('should return a filter with its name prefixed in a format AWS ' +
      'expects when looking for tag _key_ names/values',
      () => {
        const f = ec2.createTagKey(['me']);
        expect(f.Name).to.equal('tag-key');
      });
  });

  describe('createClusternator function', () => {
    it('should return a filter that finds items with a tag key value of the' +
        '"Clusternator" tag',
      () => {
        const f = ec2.createClusternator();
        expect(f.Name).to.equal('tag-key');
        expect(f.Values[0]).to.be.ok;
      });
  });
});

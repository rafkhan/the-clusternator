'use strict';

const rewire = require('rewire');
const Q = require('q');

const ecr = rewire('./ecr');
const C = require('../../chai');

const aws = {};

function initData() {
  aws.ecr = {
    createRepository: () => Q.resolve({ repository: {} }),
    describeRepositories: () => Q.resolve({ repositories: [
      { repositoryArn: '1', repositoryName: 'test' }] }),
    deleteRepository: () => Q.resolve()
  };
}


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: ECR', () => {
  beforeEach(initData);

  describe('create function', () => {
    it('should throw without a name', () => {
      expect(() => ecr.create()).to.throw(Error);
    });

    it('should resolve if AWS ecr resolves', (done) => {
      ecr.create(aws, 'test')
        .then((r) => C.check(done, () => expect(r).to.be.ok), C.getFail(done));
    });

    it('should resolve if AWS ecr rejects', (done) => {
      aws.ecr.createRepository = () => Q.reject(new Error('test'));
      ecr.create(aws, 'test')
        .then((r) => C.check(done, () => expect(r).to.be.ok), C.getFail(done));
    });

    it('should reject if AWS ecr rejects *and* AWS ecr describe rejects',
      (done) => {
        aws.ecr.createRepository = () => Q.reject(new Error('test'));
        aws.ecr.describeRepositories = () => Q.reject(new Error('test 2'));
        ecr.create(aws, 'test')
          .then(C.getFail(done), (err) => C
            .check(done, () => expect(err instanceof Error).to.be.ok));
      });
  });

  describe('destroy function', () => {
    it('should throw without a name', () => {
      expect(() => ecr.destroy()).to.throw(Error);
    });

    it('should resolve if AWS ecr resolves', (done) => {
      ecr.destroy(aws, 'test')
        .then(() => C
          .check(done, () => expect(true).to.be.ok), C.getFail(done));
    });

    it('should reject if AWS ecr rejects *and* AWS ecr describe resolves',
      (done) => {
        aws.ecr.deleteRepository = () => Q.reject(new Error('test'));
        ecr.destroy(aws, 'test')
          .then(C.getFail(done), (err) => C
            .check(done, () => expect(err instanceof Error).to.be.ok));
      });

  });

  describe('list function', () => {
    it('should resolve an array of strings', (done) => {
      ecr.list(aws)
        .then((r) => C
          .check(done, () => expect(Array
            .isArray(r))).to.be.ok, C.getFail(done));
    });
  });

  describe('arn function', () => {
    it('should throw without a name', () => {
      expect(() => ecr.arn()).to.throw(Error);
    });
    it('should resolve a string', (done) => {
      ecr.arn(aws, 'test')
        .then((r) => C
          .check(done, () => expect(typeof r === 'string').to.be.ok),
          C.getFail(done));
    });
  });
});

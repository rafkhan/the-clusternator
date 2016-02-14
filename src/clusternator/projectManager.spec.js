'use strict';

var rewire = require('rewire'),
  C = require('../chai'),
  mockRequest = require('./request-mock');

var Pm = rewire('./projectManager'),
  common = rewire('./common');


/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions: 0*/
describe('Clusternator\'s project manager', () => {
  var oldReq, pm;

  beforeEach(() => {
    oldReq = common.__get__('request');
    common.__set__('request', mockRequest);
      pm = Pm();
  });

  afterEach(() => {
    mockRequest.setResponse( {
      statusCode: 200
    });
    mockRequest.setResult({ payload: null });
    common.__set__('request', oldReq);
  });

  it('makePostRequest should fail on error', (done) => {
    mockRequest.setResult(new Error('test failure'));

    common.helpers.makePostRequest('localhost', { test: 't' }).
    then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });
  });

  it('makeGetRequest should fail on error', (done) => {
    mockRequest.setResult(new Error('test failure'));

    common.helpers.makeGetRequest('localhost').
    then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });

  });

  it('makePostRequest should fail if status code is an error', (done) => {
    mockRequest.setResponse({ statusCode: 500 });

    common.helpers.makePostRequest('localhost', { test: 't' }).
    then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });
  });

  it('makePostRequest should resolve if there is a 200 status code', (done) => {
    common.helpers.makePostRequest('localhost', { test: 't' }).
    then((result) => {
      C.check(done, () => {
        expect(result).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('makeGetRequest should resolve if there is a 200 status code', (done) => {
    common.helpers.makeGetRequest('localhost').
    then((result) => {
      C.check(done, () => {
        expect(result).to.be.ok;
      });
    }, C.getFail(done));

  });

  it('normalizeEndSlash should add a / to the end of a host if it is not ' +
    'present', () => {
    expect(common.helpers.normalizeEndSlash('blah')).to.equal('blah/');
  });

  it('normalizeEndSlash should not add a / to the end of a host if it exists',
    () => {
      expect(common.helpers.normalizeEndSlash('blah/')).to.equal('blah/');
    });

});

'use strict';

var rewire = require('rewire'),
  C = require('../chai'),
  mockRequest = require('./request-mock');

var Pm = rewire('../../../src/clusternator/projectManager');


/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions: 0*/
describe('Clusternator\'s project manager', () => {
  var oldReq, pm, validConfig = {
    user: {
      credentials: {
        user: 'test',
        token: 'testPass',
        host: '127.0.0.1'
      },
      apiVersion: '0.1'
    }
  };

  beforeEach((done) => {
    oldReq = Pm.__get__('request');
    Pm.__set__('request', mockRequest);
    Pm(validConfig).then((p) => {
      pm = p;
      done();
    }, C.getFail(done));
  });

  afterEach(() => {
    mockRequest.setResult({});
    mockRequest.setResponse( {
      statusCode: 200
    });
    Pm.__set__('request', oldReq);
  });

  it('Pm should resolve a new clusternator project manager', (done) => {
    Pm(validConfig).then((pm) => {
      C.check(done, () => {
        expect(pm).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('Pm should reject without valid credentials', (done) => {
    Pm().then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });
  });

  it('makePostRequest should fail on error', (done) => {
    mockRequest.setResult(new Error('test failure'));

    pm.helpers.makePostRequest('localhost', { test: 't' }).
    then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });
  });

  it('makeGetRequest should fail on error', (done) => {
    mockRequest.setResult(new Error('test failure'));

    pm.helpers.makeGetRequest('localhost').
    then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });

  });

  it('makePostRequest should fail if status code is an error', (done) => {
    mockRequest.setResponse({ statusCode: 500 });

    pm.helpers.makePostRequest('localhost', { test: 't' }).
    then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.ok;
      });
    });
  });

  it('makePostRequest should resolve if there is a 200 status code', (done) => {
    pm.helpers.makePostRequest('localhost', { test: 't' }).
    then((result) => {
      C.check(done, () => {
        expect(result).to.be.ok;
      });
    }, C.getFail(done));
  });

  it('makeGetRequest should resolve if there is a 200 status code', (done) => {
    pm.helpers.makeGetRequest('localhost').
    then((result) => {
      C.check(done, () => {
        expect(result).to.be.ok;
      });
    }, C.getFail(done));

  });

  it('normalizeHost should add a / to the end of a host if it is not present',
    () => {
    expect(pm.helpers.normalizeHost('blah')).to.equal('blah/');
  });

  it('normalizeHost should not add a / to the end of a host if it exists',
    () => {
      expect(pm.helpers.normalizeHost('blah/')).to.equal('blah/');
    });

});

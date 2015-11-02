'use strict';

var supertest = require('supertest');
var express = require('express');
var prHandler = require('../../src/server/pullRequest.js');

var app = express();
app.post('/test', prHandler);


describe('pull request close handler', function() {
  it('should forbid non-PR events', function(done) {
    supertest(app)
      .post('/test')
      .set('X-Github_event', 'pull_request')
      .send({})
      .expect(403, done);
  });
});

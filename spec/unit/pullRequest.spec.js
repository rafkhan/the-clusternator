'use strict';

var supertest = require('supertest');
var express = require('express');
var bodyParser = require('body-parser');
var prHandler = require('../../src/server/pullRequest.js');

var app = express();
app.use(bodyParser.json());
app.post('/test', prHandler);


describe('pull request close handler', function() {
  it('should forbid non-PR events', function(done) {
    supertest(app)
      .post('/test')
      .set('X-Github-Event', 'NOT A PR')
      .send({})
      .expect(403, done);
  });

  it('should forbid PR events that are not "closed" or "opened"', function(done) {
    supertest(app)
      .post('/test')
      .set('X-Github-Event', 'pull_request')
      .send({action: 'RAF WAS HERE'})
      .expect(403, done);
  });

  it('should accept closed events', function(done) {
    supertest(app)
      .post('/test')
      .set('X-Github-Event', 'pull_request')
      .send({action: 'closed'})
      .expect(200, done);
  });
});

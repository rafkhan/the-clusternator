'use strict';

var supertest = require('supertest');
var express = require('express');
var bodyParser = require('body-parser');
var prHandler = require('./pullRequest.js');

var app = express();
app.use(bodyParser.json());
app.post('/test', prHandler);

// @todo in an ideal world, these will work
//
///*global describe, it, expect, beforeEach */
///*eslint no-unused-expressions: 0*/
//describe('pull request close handler', () => {
//  it('should forbid non-PR events', (done) => {
//    supertest(app)
//      .post('/test')
//      .set('X-Github-Event', 'NOT A PR')
//      .send({})
//      .expect(403, done);
//  });
//
//  it('should forbid PR events that are not "closed" or "opened"', (done) => {
//    supertest(app)
//      .post('/test')
//      .set('X-Github-Event', 'pull_request')
//      .send({action: 'RAF WAS HERE'})
//      .expect(403, done);
//  });
//
//  it('should accept closed events', (done) => {
//    supertest(app)
//      .post('/test')
//      .set('X-Github-Event', 'pull_request')
//      .send({action: 'closed'})
//      .expect(200, done);
//  });
//});

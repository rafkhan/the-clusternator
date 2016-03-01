'use strict';

const supertest = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const prHandler = require('./pull-request.js');

const app = express();
app.use(bodyParser.json());
app.post('/test', prHandler);

//
///*global describe, it, expect, beforeEach */
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

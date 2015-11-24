'use strict';

const TEST_VPC = 'vpc-ab07b4cf';
const TEST_ZONE = '/hostedzone/Z1K98SX385PNRP';

var R = require('ramda');
var q = require('q');
var express = require('express');
var bodyParser = require('body-parser');
var aws = require('aws-sdk');

var getPRManager = require('../aws/prManager');
var getDynamoDBManager = require('../aws/dynamoManager');

var prHandler = require('./pullRequest');
var pushHandler = require('./push');
var loggers = require('./loggers');
var log = loggers.logger;


var GITHUB_AUTH_TOKEN_TABLE = 'github_tokens';


function createServer(prManager) {
  var app = express();

  function ping(req, res) {
    res.send('Still alive.');
  }

  // TODO: SSL, auth

  var curriedPushHandler = R.curry(pushHandler)(prManager);
  var curriedPRHandler = R.curry(prHandler)(prManager);

  app.use(bodyParser.json());
  app.use(loggers.request);

  app.get('/ping', ping);
  app.post('/clusternate', curriedPushHandler); // CI post-build hook
  app.post('/github/pr', curriedPRHandler);     // github close PR hook

  app.use(loggers.error);

  return app;
}

function getAwsResources(config) {
  var ec2 = new aws.EC2(config.credentials);
  var ecs = new aws.ECS(config.credentials);
  var r53 = new aws.Route53(config.credentials);
  var ddb = new aws.DynamoDB(config.credentials);

  return {
    ec2: ec2,
    ecs: ecs,
    r53: r53,
    ddb: ddb
  };
}

// XXX
// This function is here to force the PR manager to load asynchronously,
// such that we can query for a VPC ID before starting (as opposed to
// using a hardcoded one right now).
//
function loadPRManagerAsync(ec2, ecs, r53) {
  var prm = getPRManager(ec2, ecs, r53, TEST_VPC, TEST_ZONE);
  return q.resolve(prm);
}

function createAndPollTable(ddbManager, tableName) {
  return ddbManager.createTable(tableName)
    .then(() => {
      return ddbManager.pollForActiveTable(GITHUB_AUTH_TOKEN_TABLE);
    }, q.reject);
}

function initializeWebhookTable(ddbManager) {
  log.info('Looking for DynamoDB table: %s',
    GITHUB_AUTH_TOKEN_TABLE);

  return ddbManager.checkTableExistence(GITHUB_AUTH_TOKEN_TABLE)
    .then((exists) => {
      if(exists) {
        log.info('DynamoDB table %s was found',
          GITHUB_AUTH_TOKEN_TABLE);

        return q.resolve();
      } else {
        log.info('DynamoDB table %s was not found',
          GITHUB_AUTH_TOKEN_TABLE);

        return createAndPollTable(ddbManager, GITHUB_AUTH_TOKEN_TABLE);
      }
    }, q.reject)

    .then(() => {
      log.info('table active');
    }, (err) => {
      log.error(err, err.stack);
    });
}

function getServer(config) {
  var a = getAwsResources(config);

  var ddbManager = getDynamoDBManager(a.ddb);

  return initializeWebhookTable(ddbManager)
    .then(() => {
      return loadPRManagerAsync(a.ec2, a.ecs, a.r53)
    }, q.reject)
    .then(createServer, q.reject);
}

function startServer(config) {
  return getServer(config)
    .then((server) => {
      server.listen(config.port); 
      console.log('Clusternator listening on port', config.port)
    }, (err) => {
      
    });
}

module.exports = {
  getServer: getServer,
  startServer: startServer
};

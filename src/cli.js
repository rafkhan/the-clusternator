'use strict';

var fs = require('fs');
var path = require('path');
var log = require('winston');

var util = require('./util');
var server = require('./server/main');
var circleCIClient = require('./client/circleCIClient');
var clusternator = require('./clusternator');
var clusternatorJson = require('./clusternator-json');
var gpg = require('./cli-wrappers/gpg');
var awsProject = require('./aws/projectManager');


/**
 * @returns {Q.Promise}
 */
function initAwsProject() {
  var c = require('./config'),
    a = require('aws-sdk'),
    config = c(),
    ec2 = new a.EC2(config.credentials),
    ecs = new a.ECS(config.credentials),
    r53 = new a.Route53(config.credentials);

    return awsProject(ec2, ecs, r53);
}

function newApp(argv) {
  return function() {
    var clusterName = argv.cluster;
    var appDefPath = argv.app;

    var EC2APIConfig = {
      ClientToken: (new Date()).valueOf().toString()
    };

    var keyPairName = argv.keypair;
    if (!keyPairName) {
      console.log('Consider adding a --keypair');
    } else {
      EC2APIConfig.KeyName = keyPairName;
    }

    var subnetId = argv['subnet-id'];
    var securityGroup = argv['security-group'];
    if ((subnetId && !securityGroup) || (!subnetId && securityGroup)) {
      log.info('You must include both a subnet ID and a security group ID');

    } else if (subnetId && securityGroup) {
      var networkInterfaces = [{
        DeviceIndex: 0,
        //NetworkInterfaceId: NETWORK_INTERFACE_ID,
        AssociatePublicIpAddress: true,
        SubnetId: subnetId,
        DeleteOnTermination: true,
        Groups: [securityGroup]
      }];

      EC2APIConfig.NetworkInterfaces = networkInterfaces;
    }


    // Pass in all auth data, will prioritize dockerCfg
    var dockerAuth;
    var dockerCfg = argv['docker-cfg'];
    var dockerEmail = argv['docker-email'];
    var dockerPassword = argv['docker-password'];
    var dockerUsername = argv['docker-username'];

    if (dockerCfg || dockerEmail || dockerPassword || dockerUsername) {
      dockerAuth = {
        cfg: dockerCfg,
        email: dockerEmail,
        password: dockerPassword,
        username: dockerUsername
      };
    }


    var ec2Config = {
      auth: dockerAuth,
      clusterName: clusterName,
      apiConfig: EC2APIConfig
    };

    var app = JSON.parse(fs.readFileSync(appDefPath, 'utf8'));

    return clusternator.newApp(clusterName, app, ec2Config)
      .then(function(data) {
        console.log(data);
      }, util.errLog)
      .then(null, util.errLog);
    //TODO REMOVE THAT
  };
}


function updateApp(argv) {

  return function() {
    var clusterName = argv.cluster;
    var appDefPath = argv.app;

    var app = JSON.parse(fs.readFileSync(appDefPath, 'utf8'));

    return clusternator.updateApp(clusterName, app);
  };
}


function destroyApp(argv) {
  return function() {
    var clusterName = argv.cluster;
    return clusternator.destroyApp(clusterName);
  };
}


function startServer(argv) {
  var config = require('./config')();
  return function() {
    return server.startServer(config);
  };
}


function circleCIPush(argv) {
  return function() {
    return circleCIClient.push(argv.host, argv.appdef, argv.tag);
  };
}

function circleCITag(argv) {
  return function() {
    var ridData = circleCIClient.generateTagFromEnv();
    console.log(ridData.tag);
    return;
  };
}

function createAppDefinition() {

  return function() {
    var defaultAppPath = path.resolve(__dirname,
      '../examples/DEFAULT.json');
    var defaultApp = JSON.parse(
      fs.readFileSync(defaultAppPath, 'utf8'));

    var prettyString = JSON.stringify(defaultApp, null, 2);
    console.log(prettyString);
  };
}

function bootstrapAWS() {
  console.log('bootstrap an AWS environment');
}

function initializeProject(y) {
  var argv = y.demand('o').
  alias('o', 'offline').
  default('o', false).
  describe('o', 'offline only, makes "clusternator.json" but does *not* ' +
    'check the cloud infrastructure').
    argv;

  return clusternatorJson.findProjectRoot().then((root) => {
    return clusternatorJson.skipIfExists(root).then(() => { return root; });
  }).then((root) => {
    return clusternatorJson.findProjectNames(root).then((names) => {
      return {
        name: names[0]
      };
    }).
    then(clusternatorJson.createInteractive).
    then((results) => {
      // parse results
      return clusternatorJson.writeFromFullAnswers({
        projectDir: root,
        answers: results
      }).then((fullAnswers) => {
        return {
          root,
          fullAnswers
        };
      });
    });
  }).then((initDetails) => {
    var output = 'Clusternator Initialized With Config: ' +
      clusternatorJson.fullPath(initDetails.root);
    if (argv.o) {
      util.plog(output + ' Network Resources *NOT* Checked');
      return;
    }
    return initAwsProject().then((pm) => {
      return pm.create(initDetails.fullAnswers.answers.projectId).then(() => {
        util.plog(output + ' Network Resources Checked');
      });
    });
  }).fail((err) => {
    util.plog('Clusternator: Initizalization Error: ' + err.message);
  }).done();
}

function pullRequest(y) {
  console.log('Initializing new pull request: #' + y.argv._[1]);
}

function create(y) {

}

function destroy(y) {

}

function makePrivate(y) {
  y.demand('p').
  alias('p', 'passphrase').
  describe('p', 'Requires a passphrase to encrypt private files/directories');

  return clusternatorJson.makePrivate(y.argv.p).then(() => {
    util.plog('Clusternator: Private files/directories encrypted');
  });
}

function readPrivate(y) {
  y.demand('p').
  alias('p', 'passphrase').
  describe('p', 'Requires a passphrase to encrypt private files/directories');

  return clusternatorJson.readPrivate(y.argv.p).then(() => {
    util.plog('Clusternator: Private files/directories un-encrypted');
  });
}

function generatePass() {
  return gpg.generatePass().then((passphrase) => {
    util.plog('Keep this passphrase secure: ' + passphrase);
  }, (err) => {
    util.plog('Error generating passphrase: ' + err.message);
  });
}

function deploy(y) {
  var argv = y.demand('d').
  alias('d', 'deployment-name').
  default('d', 'master', 'The "master" deployment').
  describe('d', 'Requires a deployment name').
    argv;

  console.log('deployment', argv);
}


function describe(y) {
  y.demand('p').
  alias('p', 'pull-request').
  default('p', 'all', 'All pull requests').
  describe('p', 'Limits the description to a pull request').
  demand('r').
  alias('r', 'resource').
  default('r', 'all', 'All resource types').
  choices('r', ['all', 'securityGroups', 'instances', 'services']).
  describe('r', 'Limits the description to a resource type');

  if (y.argv.p !== 'all') {
    console.log('Describing resources associated to pr #' + y.argv.p);
  } else {
    console.log('Describing *all* resources in use');
  }
}

module.exports = {
  newApp: newApp,
  updateApp: updateApp,
  destroyApp: destroyApp,
  startServer: startServer,

  circleCIPush: circleCIPush,
  circleCITag: circleCITag,

  createAppDefinition: createAppDefinition,

  bootstrap: bootstrapAWS,
  init: initializeProject,
  pullRequest: pullRequest,
  describe: describe,
  create,
  destroy,

  makePrivate,
  readPrivate,
  generatePass,

  deploy
};

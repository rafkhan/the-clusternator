#!/usr/bin/env node

'use strict';

require('babel/register');

var R = require('ramda');
var yargs = require('yargs');

var cli = require('../lib/cli');

var DEFAULT_PORT = 3000;

yargs.usage('Usage: $0 <command> [opts]');

var dockerCredOpts = {
  'docker-email': {
    alias: 'de',
    describe: 'Docker email'
  },

  'docker-username': {
    alias: 'du',
    describe: 'Docker username'
  },

  'docker-password': {
    alias: 'dp',
    describe: 'Docker password'
  },

  'docker-cfg': {
    alias: 'dc',
    describe: '.dockercfg auth'
  }
};

yargs.command('ci:circle:build',
              'Build your app on circleCI and triggers ECS build',
              function(y) {
                var opts = {
                  host: {
                    alias: 'h',
                    demand: true,
                    describe: 'Clusternator server IP addr / host name'
                  },

                  app: {
                    alias: 'a',
                    demand: true,
                    describe: 'App definition file location'
                  },

                  keypair: {
                    alias: 'k',
                    demand: true,
                    describe: 'Keypair name to be used for SSH access to EC2'
                  },
                };

                y.options(R.merge(opts, dockerCredOpts))
                 .help('help');
              });


yargs.command('server:start',
              'Start a clusternator server',
              function(y) {
                var opts = {
                  port: {
                    alias: 'p',
                    describe: 'Port number to run server on',
                    default: DEFAULT_PORT
                  }
                };
                y.options(R.merge(opts, dockerCredOpts))
                 .help('help');
              });


yargs.command('cluster:new',
              'Create a new cluster',
              function(y) {
                var opts = {
                  cluster: {
                    alias: 'c',
                    describe: 'Cluster name for your app',
                    demand: true
                  },

                  app: {
                    alias: 'a',
                    describe: 'App definition file',
                    demand: true
                  },

                  keypair: {
                    alias: 'k',
                    describe: 'Name of keypair for SSHing into ECS agent'
                  },

                  'subnet-id': {
                    alias: 'n',
                    describe: 'Subnet ID if you want to join existing subnet'
                  },

                  'security-group': {
                    alias: 'g',
                    describe: 'Security group ID you want your cluster to use'
                  },
                };
                y.options(R.merge(opts, dockerCredOpts))
                 .help('help');
              });


yargs.command('cluster:update',
              'Update an existing cluster',
              function(y) {
                 var opts = {
                  cluster: {
                    alias: 'c',
                    describe: 'Cluster name',
                    demand: true
                  },

                  app: {
                    alias: 'a',
                    describe: 'App definition file',
                    demand: true
                  }
                };
                y.options(opts)
                 .help('help');
              });


yargs.command('app:new',
              'Creates a new app definition',
              function(){});


yargs.help('help');
var argv = yargs.argv;
var command = argv._[0];

if(command === 'ci:circle:build') {
  cli.circleCIBuild(argv)();
  setInterval(function(){}, 10000);

} else if(command === 'server:start') {
  cli.startServer(argv)();

} else if(command === 'cluster:new') {
  cli.newApp(argv)();
  setInterval(function(){}, 10000);

} else if(command === 'cluster:update') {
  cli.updateApp(argv)()
    .then(function(data) { 
      console.log('Done.');
      process.exit(0);
    }, function(err) {
      console.log('ERROR', err);
    });

} else if(command === 'app:new') {
  cli.createAppDefinition(argv)();

} else {
  yargs.showHelp();
}


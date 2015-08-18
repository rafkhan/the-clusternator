#!/usr/bin/env node --harmony

'use strict';

var R = require('ramda');
var yargs = require('yargs');

var cli = require('../lib/cli');

var DEFAULT_PORT = 3000;

yargs.usage('Usage: $0 <command> [opts]');

var dockerCredOpts = {
  dockerEmail: {
    describe: 'Docker email'
  },

  dockerUser: {
    describe: 'Docker username'
  },

  dockerPass: {
    describe: 'Docker password'
  }
};

yargs.command('ci:circle:build',
              'Build your app on circleCI and triggers ECS build',
              function(y) {
                var opts = {
                  clusternatorHost: {
                    demand: true,
                    describe: 'Clusternator server IP addr / host name'
                  },

                  app: {
                    demand: true,
                    describe: 'App definition file location'
                  },

                  keypair: {
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
                    describe: 'Cluster name for your app',
                    demand: true
                  },

                  app: {
                    describe: 'App definition file',
                    demand: true
                  },

                  keypair: {
                    alias: 'k',
                    describe: 'Name of keypair for SSHing into ECS agent'
                  }
                };
                y.options(opts)
                 .help('help');
              });


yargs.command('cluster:update',
              'Update an existing cluster',
              function(y) {
                 var opts = {
                  cluster: {
                    describe: 'Cluster name',
                    demand: true
                  },

                  app: {
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
  cli.updateApp(argv)();
  setInterval(function(){}, 10000);

} else if(command === 'app:new') {
  cli.createAppDefinition(argv)();

} else {
  yargs.showHelp();
}


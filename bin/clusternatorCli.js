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
                  }
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


yargs.help('help');
var argv = yargs.argv;
var command = argv._[0];

if(command === 'ci:circle:build') {
  cli.circleCIBuild(argv)();
  setInterval(function(){}, 10000);
} else if(command === 'server:start') {
  cli.startServer(argv)();
} else {
  yargs.showHelp();
}


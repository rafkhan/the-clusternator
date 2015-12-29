'use strict';

const dockerCredOpts = {
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

const R = require('ramda');

const cli = require('./legacy-cli');
const cmn = require('../common');
const util = cmn.src('util');

module.exports = (yargs) => {

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


  yargs.command('cluster:delete',
    'Delete an existing cluster',
    function(y) {
      var opts = {
        cluster: {
          alias: 'c',
          describe: 'Cluster name',
          demand: true
        }
      };

      y.options(opts)
        .help('help');
    });

  /**
   * @todo yargify everything from here down.  Manual if/else *not* required
   */
  yargs.help('help');
  var argv = yargs.argv;
  var command = argv._[0];

  if (command === 'cluster:new') {
    cli.newApp(argv)();
    setInterval(function() {}, 10000);

  } else if (command === 'cluster:update') {
    cli.updateApp(argv)()
      .then(function(data) {
        util.info('Done.');
        process.exit(0);
      }, function(err) {
        util.error(err);
      });

  } else if (command === 'cluster:delete') {
    cli.destroyApp(argv)()
      .then(function(data) {
        util.info('Done.');
        process.exit(0);
      }, function(err) {
        util.error('ERROR', err);
      });

  } else if (command === 'app:new') {
    cli.createAppDefinition(argv)();

  }


};


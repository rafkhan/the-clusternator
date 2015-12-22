#!/usr/bin/env node


'use strict';

var R = require('ramda'),
    yargs = require('yargs'),
    util = require('../lib/util'),
    constants = require('../lib/constants'),
    cli = require('../lib/cli');

cliLogger();

function cliLogger() {
  var INFO = 2;
  var LOG_MAX = 5;

  var argv = yargs.count('verbose').alias('v', 'verbose').describe('v', 'Verbosity, defaults to info, add more v\'s to increase').boolean('quiet').alias('q', 'quiet').describe('q', 'Quiet mode, only errors will output (overrides -v)').argv;

  if (argv.q) {
    util.winston.transports.console.level = constants.LOG_LEVELS[0];
  } else {
    var logLevel = INFO + argv.v > LOG_MAX ? LOG_MAX : INFO + argv.v;
    util.winston.transports.console.level = constants.LOG_LEVELS[logLevel];
  }
}

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

yargs.command('circleci:push', 'Triggers ECS build from circleCI', function (y) {
  var opts = {
    host: {
      alias: 'h',
      demand: true,
      describe: 'Clusternator server IP addr / host name'
    },

    appdef: {
      alias: 'a',
      demand: true,
      describe: 'App definition file location'
    },

    tag: {
      alias: 't',
      demand: true,
      describe: 'Unique tag for this build'
    }
  };

  y.options(opts).help('help');
});

yargs.command('circleci:tag', 'Generates tag for CircleCI PR', function (y) {
  var opts = {};

  y.options(opts).help('help');
});

yargs.command('server:start', 'Start a clusternator server', function (y) {
  var opts = {};

  y.options(opts).help('help');
});

yargs.command('cluster:new', 'Create a new cluster', function (y) {
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
    }
  };
  y.options(R.merge(opts, dockerCredOpts)).help('help');
});

yargs.command('cluster:update', 'Update an existing cluster', function (y) {
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
  y.options(opts).help('help');
});

yargs.command('cluster:delete', 'Delete an existing cluster', function (y) {
  var opts = {
    cluster: {
      alias: 'c',
      describe: 'Cluster name',
      demand: true
    }
  };

  y.options(opts).help('help');
});

yargs.command('app:new', 'Creates a new app definition', function () {});

yargs.command('init', 'Initializes a `.clusternator` file in the project ' + 'repo, and provisions AWS networking resources.  Requires AWS credentials', cli.init);

yargs.command('bootstrap', 'Bootstraps an AWS environment so that projects ' + 'can be launched into it', cli.bootstrap);

yargs.command('pull-request', 'Manually Execute a Pull Request', cli.pullRequest);

yargs.command('describe', 'Describe a resource', cli.describe);

yargs.command('create', 'Create a resource', cli.create);

yargs.command('destroy', 'Destroy a resource', cli.destroy);

yargs.command('generate-pass', 'Generate a secure passphrase', cli.generatePass);

yargs.command('make-private', 'Encrypts private assets (defined in ' + 'clusternator.json)', cli.makePrivate);

yargs.command('read-private', 'Decrypts private assets (defined in ' + 'clusternator.json)', cli.readPrivate);

yargs.command('deploy', 'Makes a deployment', cli.deploy);

yargs.command('stop', 'Stops a deployment, and cleans up', cli.stop);

yargs.command('generate-deployment', 'Generates a deployment config', cli.generateDeployment);

yargs.command('list-projects', 'List projects with clusternator resources', cli.listProjects);

yargs.command('describe-services', 'Describe project services', cli.describeServices);

yargs.command('add-new-ssh-key', 'Adds a new SSH Key', cli.newSSH);

yargs.command('build', 'Local Docker Build', cli.dockerBuild);

yargs.command('private-checksum', 'Calculates the hash of .private, and ' + 'writes it to .clusternator/.private-checksum', cli.privateChecksum);

yargs.command('private-diff', 'Exits 0 if there is no difference between ' + '.clusternator/.private-checksum and a fresh checksum; Exits 1 on mismatch, ' + 'and exits 2 if private-checksum is not found', cli.privateDiff);

yargs.command('config', 'Configure the local clusternator user', cli.configUser);

yargs.command('log', 'Application logs from a user selected server', cli.logApp);

yargs.command('log-ecs', 'ECS logs from a user selected server', cli.logEcs);

yargs.command('ssh', 'SSH to a selected server', cli.ssh);

/**
 * @todo yargify everything from here down.  Manual if/else *not* required
 */
yargs.help('help');
var argv = yargs.argv;
var command = argv._[0];

if (command === 'circleci:push') {
  cli.circleCIPush(argv)().then(function () {
    util.info('Done.');
    process.exit(0);
  }, function (err) {
    util.error(err);
    process.exit(-1);
  });
} else if (command === 'circleci:tag') {
  cli.circleCITag(argv)();
} else if (command === 'server:start') {
  cli.startServer(argv)().then(function () {
    util.info('Successfully started server.');
  }, function (err) {
    util.error('can not start server:', err);
    process.exit(-1);
  });
} else if (command === 'cluster:new') {
  cli.newApp(argv)();
  setInterval(function () {}, 10000);
} else if (command === 'cluster:update') {
  cli.updateApp(argv)().then(function (data) {
    util.info('Done.');
    process.exit(0);
  }, function (err) {
    util.error(err);
  });
} else if (command === 'cluster:delete') {
  cli.destroyApp(argv)().then(function (data) {
    util.info('Done.');
    process.exit(0);
  }, function (err) {
    util.error('ERROR', err);
  });
} else if (command === 'app:new') {
  cli.createAppDefinition(argv)();
} else {
  //yargs.showHelp();
}
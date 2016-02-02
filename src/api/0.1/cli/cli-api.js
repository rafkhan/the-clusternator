'use strict';
/**
 * This is the primary interface to the {@link module:clusternatorCli} stub
 *
 * This module uses yargs to communicate with the user/CLI and has no utility
 * outside of being the place to configure the CLI arguments.
 *
 * @module api/'0.1'/cli
 */

const API = '0.1';

const path = require('path');

const cmn = require('../common');
const util = cmn.src('util');
const Config = cmn.src('config');

const cn = require('../js/js-api');
const deployments = require('./deployments');
const stdioI = require('./stdio-inheritors');
const project = require('./project');
const user = require('./user');
const projectDb = require('./project-db');
const aws = require('./cloud-service');

const privateFs = require('../project-fs/private');
const dockerFs = require('../project-fs/docker');
const deploymentsFs = require('../project-fs/deployments');
const gitHooks = require('../project-fs/git-hooks');

const legacy = require('./legacy-yargs');

const getPackage = () => require('../../../../package.json');

module.exports = (yargs) => {

  util.cliLogger(yargs);

  yargs.usage('Usage: $0 <command> [opts]');


  yargs
    .completion('completion', 'Generate bash completions')
    .command('bootstrap', 'Bootstraps an AWS environment so that projects ' +
      'can be launched into it', () => util.info('Bootstrap environment'))
    .command('init', 'Initializes a `.clusternator` file in the project ' +
      'repo, and provisions AWS networking resources.  Requires AWS ' +
      'credentials', (y) => {
      y.demand('o')
        .alias('o', 'offline')
        .default('o', false)
        .describe('o', 'offline only, makes "clusternator.json" but does ' +
          '*not* check the cloud infrastructure');

      project.init(y.argv.o).done();
    })
    .command('project', 'Project management commands (try ' +
      'clusternator project --help)',
      (y) => {
        y.usage('Usage: $0 project <command> [opts]')
          .command('create-data', 'create project db entry',
            () => projectDb.createData().done())
          .command('git-hub-key', 'Display GitHub key ' +
            '(warning returns secret GitHub key)',
            () => projectDb.getGitHub().done())
          .command('shared-key', 'Display shared key ' +
            '(warning returns secret shared key)',
            () => projectDb.getShared().done())
          .command('reset-auth-token', 'Reset authentication token',
            () => projectDb.resetAuth().done())
          .command('reset-git-hub-key', 'Reset GitHub key',
            () => projectDb.resetGitHub().done())
          .command('reset-shared-key', 'Reset shared key',
            () => projectDb.resetShared().done())
          .help('h')
          .alias('h', 'help');
      })
    .command('config', 'Configure the local clusternator user',
      () => Config.interactiveUser().done())
    .command('create-user', 'Create a user on the clusternator server', (y) => {
      y.demand('n')
        .alias('n', 'username')
        .describe('n', 'Username for the account')
        .default('n', '')
        .demand('p')
        .alias('p', 'password')
        .describe('p', 'password for the user')
        .default('p', '')
        .demand('c')
        .alias('c', 'confirm-password')
        .describe('c', 'confirm user password')
        .default('c', '')
        .demand('a')
        .alias('a', 'authority')
        .default('a', 2)
        .describe('a', 'authority of the user {number} lower numbers have ' +
          'more authority than higher number');
      user.createUser(y.argv.n, y.argv.p, y.argv.c, y.argv.a)
        .fail((err) => console
          .log(`Error creating user: ${err.message}`))
        .done();
    })
    .command('login', 'Login to the clusternator server',
      (y) =>  {
        y.demand('p')
          .alias('p', 'password')
          .describe('p', 'your password (be careful with shell entry like ' +
            'this)')
          .default('p', '')
          .demand('u')
          .alias('u', 'user-name')
          .describe('u', 'user name to login with, (defaults to local config ' +
            'if available)')
          .default('u', '');

        return user.login(y.argv.u, y.argv.p).fail((err) => console
          .log(`Error logging in: ${err.message}`))
          .done();
      })
    .command('passwd', 'Change your clusternator server password',
      (y) => {
        y.demand('p')
          .alias('p', 'password')
          .describe('your password (be careful with shell entry like this)')
          .default('p', '')
          .demand('n')
          .alias('n', 'new-password')
          .describe('n', 'your NEW password (be careful with shell entry ' +
            'like this)')
          .default('n', '')
          .demand('c')
          .alias('c', 'confirm-password')
          .describe('c', 'confirm your NEW password')
          .default('c', '')
          .demand('u')
          .alias('u', 'user-name')
          .describe('u', 'user name to login with')
          .default('u', '');

        return user.changePassword(y.argv.u, y.argv.p, y.argv.n, y.argv.c)
          .fail((err) => console
            .log(`Error logging in: ${err.message}`))
          .done();
      })
    .command('serve', 'Start a clusternator server. (typically prefer npm ' +
      'start, or serve.sh', () =>  {
      const config = Config();
      return cn.startServer(config);
    })

    .command('list-projects', 'List projects with clusternator resources',
      (y) => aws
        .listProjects()
        .then((projectNames) => projectNames
          .forEach(console.log))
        .done())
    .command('describe-services', 'Describe project services', aws
      .describeServices())
    .command('build', 'Local Docker Build', (y) => {
      var id = (+Date.now()).toString(16),
        argv = demandPassphrase(y)
          .demand('i')
          .alias('i', 'image')
          .describe('i', 'Name of the docker image to create')
          .default('i', id)
          .argv;

      util.info('Building Docker Image: ', argv.i);

      return dockerFs
        .build(argv.i, argv.p).fail((err) => {
          util.error('Error building local Docker image: ', err);
        }).done();
    })
    .command('deploy', 'Makes a deployment', (y) => {
      y.demand('d').
      alias('d', 'deployment-name').
      describe('d', 'Requires a deployment name');

      deployments.deploy(y.argv.d).done();
    })
    .command('stop', 'Stops a deployment, and cleans up', (y) => {
      y.demand('d').
      alias('d', 'deployment-name').
      describe('d', 'Requires a deployment name');

      deployments.stop(y.argv.d).done();
    })

    .command('update', 'Updates a deployment in place', (y) => {
      y.demand('d').
      alias('d', 'deployment-name').
      describe('d', 'Requires a deployment name');

      deployments.update(y.argv.d).done();
    })

    .command('generate-deployment', 'Generates a deployment config', (y) => {
      y.demand('d').
      alias('d', 'deployment-name').
      describe('d', 'Requires a deployment name');

      deploymentsFs.generateDeploymentFromName(y.argv.d).done();
    })
    .command('generate-ssh-key', 'Adds a new SSH Key', (y) => {
      y.demand('n').
      alias('n', 'name').
      describe('n', 'Creates a new SSH key with the provided name.  The ' +
        'keypair are stored in ~/.ssh, and the public key is installed into ' +
        'the project');

      stdioI.newSshKey(y.argv.n).done();
    })
    .command('generate-pass', 'Generate a secure passphrase', () => cn
      .generatePass()
      .then((passphrase) => util
        .info('Keep this passphrase secure: ' + passphrase))
      .fail((err) => util
        .info('Error generating passphrase: ' + err.message)))

    .command('git-hook-install', 'Install auto-encrypt/decrypt git hooks',
      gitHooks.install)

    .command('git-hook-remove', 'Remove auto-encrypt/decrypt git hooks',
      gitHooks.remove)

    .command('make-private', 'Encrypts private assets (defined in ' +
      'clusternator.json)', (y) => {
      demandPassphrase(y);

      privateFs.makePrivate(y.argv.p);

    })
    .command('read-private', 'Decrypts private assets (defined in ' +
      'clusternator.json)', (y) => {

      demandPassphrase(y);

      privateFs.readPrivate(y.argv.p).done();
    })

    .command('cert-upload', 'Upload a new SSL certificate', (y) => {
      y.demand('n')
        .alias('n', 'name')
        .describe('n', 'Unique Name to give the certificate')
        .demand('p')
        .alias('p', 'private-key')
        .describe('p', 'Path to private key')
        .demand('c')
        .alias('c', 'certificate')
        .describe('c', 'Path to signed certificate')
        .demand('h')
        .alias('h', 'chain')
        .describe('h', 'Path to certificate chain')
        .default('h', '');

      aws.certUpload(y.argv.p, y.argv.c, y.argv.n, y.argv.h)
        .fail(console.log)
        .done();
    })
    .command('cert-delete', 'Destroy an uploaded SSL certificate')
    .command('cert-list', 'List uploaded SSL certificates', () => cn
      .certList()
      .then(console.log))

    .command('private-checksum', 'Calculates the hash of .private, and ' +
      'writes it to .clusternator/.private-checksum', privateFs.checksum)
    .command('private-diff', 'Exits 0 if there is no difference between ' +
      '.clusternator/.private-checksum and a fresh checksum Exits 1 on ' +
      'mismatch, and exits 2 if private-checksum is not found',
      privateFs.diff)

    .command('log', 'Application logs from a user selected server',
      stdioI.logApp)
    .command('log-ecs', 'ECS logs from a user selected server',
      stdioI.logEcs)
    .command('ssh', 'SSH to a selected server', stdioI.sshShell)
    .version(() => {
      const pkg = getPackage();
      return `Package: ${pkg.version} API: ${API}`;
    });

  legacy(yargs);
};

function demandPassphrase(y){
  return y.demand('p').
  alias('p', 'passphrase').
  describe('p', 'Requires a passphrase to encrypt private directory');
}


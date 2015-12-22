'use strict';
const UTF8 = 'utf8',
  DOCKERFILE = 'Dockerfile',
  DOCKERFILE_NODE_LATEST = 'Dockerfile-node-14.04-4.2.3',
  DOCKERFILE_STATIC_LATEST = 'dockerfile-nginx',
  DOCKER_IGNORE = '.dockerignore',
  GIT_IGNORE = '.gitignore',
  NPM_IGNORE = '.npmignore',
  SERVE_SH = 'serve.sh',
  DECRYPT_SH = 'decrypt.sh',
  DOCKER_BUILD_SH = 'docker-build.sh',
  NOTIFY_JS = 'notify.js',
  CIRCLEFILE = 'circle.yml',
  CLUSTERNATOR_DIR = /\$CLUSTERNATOR_DIR/g,
  CLUSTERNATOR_PASS = /\$CLUSTERNATOR_PASS/g,
  PRIVATE_CHECKSUM = '.private-checksum',
  HOST = /\$HOST/g;

const fs = require('fs'),
  Q = require('q'),
  path = require('path'),
  mkdirp = Q.nfbind(require('mkdirp')),
  Config = require('./config'),
  util = require('./util'),
  server = require('./server/main'),
  circleCIClient = require('./client/circleCIClient'),
  clusternator = require('./clusternator'),
  clusternatorJson = require('./clusternator-json'),
  gpg = require('./cli-wrappers/gpg'),
  git = require('./cli-wrappers/git'),
  shaDir = require('./cli-wrappers/generate-private-sha.js'),
  docker = require('./cli-wrappers/docker'),
  sshKey = require('./cli-wrappers/ssh-keygen'),
  logRemote = require('./cli-wrappers/logs'),
  ssh = require('./cli-wrappers/ssh'),
  appDefSkeleton = require('./skeletons/app-def'),
  cnProjectManager = require('./clusternator/projectManager'),
  awsProjectManager = require('./aws/project-init'),
  constants = require('./constants');

var writeFile = Q.nbind(fs.writeFile, fs),
  readFile = Q.nbind(fs.readFile, fs),
  chmod = Q.nbind(fs.chmod, fs);


/**
 * @param {string} skeleton
 * @return {Promise<string>}
 */
function getSkeletonFile(skeleton) {
  return readFile(path.join(
    __dirname, '..', 'src', 'skeletons', skeleton
  ), UTF8);
}

function initClusternatorProject(config) {
  return cnProjectManager(config);
}

function getProjectAPI() {
  var config = Config();

  if (config.awsCredentials) {
    return awsProjectManager(config);
  }
  return initClusternatorProject(config);
}

function newApp(argv) {
  return () => {
    var clusterName = argv.cluster;
    var appDefPath = argv.app;

    var EC2APIConfig = {
      ClientToken: (new Date()).valueOf().toString()
    };

    var keyPairName = argv.keypair;
    if (!keyPairName) {
      util.info('Consider adding a --keypair');
    } else {
      EC2APIConfig.KeyName = keyPairName;
    }

    var subnetId = argv['subnet-id'];
    var securityGroup = argv['security-group'];
    if ((subnetId && !securityGroup) || (!subnetId && securityGroup)) {
      util.info('You must include both a subnet ID and a security group ID');

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

    var app = JSON.parse(fs.readFileSync(appDefPath, UTF8));

    return clusternator.newApp(clusterName, app, ec2Config)
      .then(function(data) {
        util.info(data);
      }, util.errLog)
      .then(null, util.errLog);
    //TODO REMOVE THAT
  };
}


function updateApp(argv) {

  return function() {
    var clusterName = argv.cluster;
    var appDefPath = argv.app;

    var app = JSON.parse(fs.readFileSync(appDefPath, UTF8));

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
      fs.readFileSync(defaultAppPath, UTF8));

    var prettyString = JSON.stringify(defaultApp, null, 2);
    util.info(prettyString);
  };
}

function bootstrapAWS() {
  util.info('bootstrap an AWS environment');
}

function writeDeployment(name, dDir, appDef) {
  return writeFile(path.join(dDir, name + '.json'), appDef);
}

function demandPassphrase(y){
  return y.demand('p').
  alias('p', 'passphrase').
  describe('p', 'Requires a passphrase to encrypt private directory');
}

function generateDeploymentFromName(name) {
  util.info('Generating deployment: ',  name);
  return clusternatorJson.get().then((config) => {
    var appDef = util.clone(appDefSkeleton);
    appDef.projectId = config.projectId;
    appDef = JSON.stringify(appDef, null, 2);
    return writeDeployment(name, config.deploymentsDir, appDef);
  });
}

function mapEc2ProjectDetails(instance) {
  var result = {
    type: 'type',
    identifier: '?',
    str: '',
    ip: '',
    state: ''
  }, inst, tags;
  if (!instance.Instances.length) {
    return result;
  }
  inst = instance.Instances[0];
  tags = inst.Tags;
  result.ip = inst.PublicIpAddress;
  result.state = inst.State.Name;

  tags.forEach((tag) => {
    if (tag.Key === constants.PR_TAG) {
      result.type = 'PR';
      result.identifier = tag.Value;
    }
    if (tag.Key === constants.DEPLOYMENT_TAG) {
      result.type = 'Deployment';
      result.identifier = tag.Value;
    }
  });

  result.str = `${result.type} ${result.identifier} ` +
    `(${result.ip}/${result.state})`;

  return result;
}

function listSSHAbleInstancesByProject(projectId) {
  return getProjectAPI()
    .then((pm) => pm
      .ec2
      .describeProject(projectId)
      .then((instances) => instances
          .map(mapEc2ProjectDetails)
      ));
}

function listSSHAbleInstances() {
  return clusternatorJson
    .get()
    .then((cJson) => listSSHAbleInstancesByProject(cJson.projectId));
}

/**
 * @param {function(...):Q.Promise} logFn
 */
function remoteFn(logFn) {
  return listSSHAbleInstances()
    .then((instanceDetails) => {
      if (!instanceDetails.length) {
        util.info('Sorry no instances available to log into');
        return;
      }
      return util
        .inquirerPrompt([{
          name: 'chosenBox',
          type: 'list',
          choices: instanceDetails.map((id) => id.str),
          message: 'Choose a Box to Log' }])
        .then((answers) => logFn(instanceDetails
            .filter((id) => id.str === answers.chosenBox)
            .map((id) => id.ip )[0])); });
}

function sshShell() {
  return remoteFn(ssh.shell)
  .done();
}

function logApp() {
  return remoteFn(logRemote.logApp)
    .done();
}

function logEcs() {
  return remoteFn(logRemote.logEcs)
    .done();
}

/**
 * @param {string[]} names
 * @returns {{name: string}}
 */
function pickBestName(names) {
  return {
    name: names[0]
  };
}

/**
 * @param {string} ignoreFile
 * @param {Object} fullAnswers
 * @returns {Q.Promise}
 */
function addPrivateToIgnore(ignoreFile, fullAnswers) {
  const priv = fullAnswers.answers.private;

  return clusternatorJson
    .readIgnoreFile(
      path.join(__dirname, '..', 'src', 'skeletons', ignoreFile), true)
    .then((ignores) => ignores .concat(priv))
    .then((ignores) => clusternatorJson.addToIgnore(ignoreFile, ignores));
}

/**
 * @param {Object} fullAnswers
 * @returns {Q.Promise}
 */
function addPrivateToGitIgnore(fullAnswers) {
  return addPrivateToIgnore(GIT_IGNORE, fullAnswers);
}

/**
 * @param {Object} fullAnswers
 * @returns {Q.Promise}
 */
function addPrivateToNpmIgnore(fullAnswers) {
  return addPrivateToIgnore(NPM_IGNORE, fullAnswers);
}

/**
 * @param {Object} fullAnswers
 * @returns {Q.Promise}
 */
function addPrivateToDockerIgnore(fullAnswers) {
  return addPrivateToIgnore(DOCKER_IGNORE, fullAnswers);
}

/**
 * @param {Object} results
 * @param {string} root - the project's root folder
 * @returns {Q.Promise}
 */
function processInitUserOptions(results, root) {
  // parse results
  return clusternatorJson
    .writeFromFullAnswers({
      projectDir: root,
      answers: results
    })
    .then((fullAnswers) => Q.all([
      addPrivateToGitIgnore(fullAnswers),
      addPrivateToNpmIgnore(fullAnswers),
      addPrivateToDockerIgnore(fullAnswers)
    ]).then(() => {
      return {
        root,
        fullAnswers
      };
    }));
}

/**
 * @returns {Q.Promise<string>}
 */
function getProjectRootRejectIfClusternatorJsonExists() {
  return clusternatorJson
    .findProjectRoot()
    .then((root) => clusternatorJson
      .skipIfExists(root)
      .then(() => root ));
}

function installExecutable(destFilePath, fileContents, perms) {
  perms = perms || '700';
  return writeFile(destFilePath, fileContents).then(() => {
    return chmod(destFilePath, '700');
  });
}

function installGitHook(root, name, passphrase) {
  return getSkeletonFile('git-' + name)
    .then((contents) => {
      contents = contents.replace(CLUSTERNATOR_PASS, passphrase);
      return installExecutable(
        path.join(root, '.git', 'hooks', name), contents, 300);
    });
}

function processGitHooks(results, root) {
  if (!results.passphrase) {
    return;
  }
  if (!results.gitHooks) {
    return;
  }
  return Q.all([
    installGitHook(root, 'post-commit', results.passphrase),
    installGitHook(root, 'pre-commit', results.passphrase),
    installGitHook(root, 'post-merge', results.passphrase)
  ]).then(() => {
    util.info('Git Hooks Installed');
    util.info('Shared Secret: ', results.passphrase);
    util.info('Do not lose the shared secret, and please keep it safe');
  });
}

/**
 * @returns {Q.Promise<Object>}
 */
function getInitUserOptions() {
  return getProjectRootRejectIfClusternatorJsonExists()
    .then((root) => {
      return clusternatorJson.findProjectNames(root)
        .then(pickBestName)
        .then(clusternatorJson.createInteractive)
        .then((results) => {
          return Q.all([
            processInitUserOptions(results, root),
            processGitHooks(results, root)
          ]).then((results) => {
            return results[0];
          });
        });
    });
}

/**
 * @param {string} clustDir
 * @param {string} tld
 * @returns {Q.promise}
 */
function initializeScripts(clustDir, tld) {
  return mkdirp(clustDir).then(() => {
    const decryptPath = path.join(clustDir, DECRYPT_SH),
      dockerBuildPath = path.join(clustDir, DOCKER_BUILD_SH),
      clusternatorPath = path.join(clustDir, NOTIFY_JS);

    return Q
      .allSettled([
        getSkeletonFile(DECRYPT_SH)
          .then((contents) => installExecutable(decryptPath, contents)),
        getSkeletonFile(DOCKER_BUILD_SH)
          .then((contents) => installExecutable(dockerBuildPath, contents)),
        getSkeletonFile(NOTIFY_JS)
          .then((contents) => contents
            .replace(HOST, tld))
          .then((contents) => writeFile(clusternatorPath, contents))]);
  });
}

/**
 * @param {string} depDir
 * @param {string} projectId
 * @param {string} dockerType
 * @returns {Q.Promise}
 */
function initializeDeployments(depDir, clustDir, projectId, dockerType) {
  return mkdirp(depDir).then(() => {
    var prAppDef = util.clone(appDefSkeleton);
    prAppDef.name = projectId;
    prAppDef = JSON.stringify(prAppDef, null, 2);

    return Q.allSettled([
      mkdirp(path.join(depDir, '..', constants.SSH_PUBLIC_PATH)),
      writeFile(path.join(depDir, 'pr.json'), prAppDef),
      writeFile(path.join(depDir, 'master.json'), prAppDef),
      initializeDockerFile(clustDir, dockerType)
    ]);
  });
}


function initializeDockerFile(clustDir, dockerType) {
  /** @todo do not overwrite existing Dockerfile */
  const template = dockerType === 'static' ?
    DOCKERFILE_STATIC_LATEST : DOCKERFILE_NODE_LATEST;
  return clusternatorJson
    .findProjectRoot()
    .then((root) => getSkeletonFile(template)
      .then((contents) => {
        contents = contents.replace(CLUSTERNATOR_DIR, clustDir);
        return writeFile(path.join(root, DOCKERFILE), contents);
      }) );
}

function initializeServeSh(root) {
  var sPath = path.join(root, SERVE_SH);
  return getSkeletonFile(SERVE_SH)
    .then((contents) => {
      return writeFile(sPath, contents);
    })
    .then(() => {
      return chmod(sPath, '755');
    });
}

function initializeCircleCIFile(root, clustDir) {
  return getSkeletonFile(CIRCLEFILE)
    .then((contents) => {
      contents = contents.replace(CLUSTERNATOR_DIR, clustDir);
      return writeFile(path.join(root, CIRCLEFILE), contents);
    });
}

function initializeOptionalDeployments(answers, projectRoot) {
  let promises = [];

  if (answers.circleCI) {
    promises.push(initializeCircleCIFile(projectRoot, answers.clusternatorDir));
  }
  if (answers.backend === 'node') {
    promises.push(initializeServeSh(
      path.join(projectRoot, answers.clusternatorDir)));
  }
  return Q.allSettled(promises);
}

function provisionProjectNetwork(projectId, output) {
  return getProjectAPI()
    .then((pm) =>  pm
      .create(projectId)
      .then(() => util
        .info(output + ' Network Resources Checked'))
      .then(() => pm
        .initializeGithubWebhookToken(projectId))
      .then((token) => console.log('STORE THIS TOKEN ON GITHUB', token))
      .fail(Q.reject));
}


function initializeProject(y) {
  var argv = y.demand('o')
    .alias('o', 'offline')
    .default('o', false)
    .describe('o', 'offline only, makes "clusternator.json" but does *not* ' +
      'check the cloud infrastructure')
    .argv;

  return getInitUserOptions()
    .then((initDetails) => {
      var output = 'Clusternator Initialized With Config: ' +
          clusternatorJson.fullPath(initDetails.root),
        dDir = initDetails.fullAnswers.answers.deploymentsDir,
        cDir = initDetails.fullAnswers.answers.clusternatorDir,
        projectId = initDetails.fullAnswers.answers.projectId,
        dockerType = initDetails.fullAnswers.answers.backend;

      return Q
        .allSettled([
          initializeDeployments(dDir, cDir, projectId, dockerType),
          initializeScripts(cDir, initDetails.fullAnswers.answers.tld),
          initializeOptionalDeployments(initDetails.fullAnswers.answers,
            initDetails.root)])
        .then(() => {
          if (argv.o) {
            util.info(output + ' Network Resources *NOT* Checked');
            return;
          }

          return provisionProjectNetwork(projectId, output);
        });
    }).fail((err) => {
      util.info('Clusternator: Initialization Error: ' + err.message);
      util.info(err.stack);
    }).done();
}

function pullRequest(y) {
  util.info('Initializing new pull request: #' + y.argv._[1]);
}

function create(y) {

}

function destroy(y) {

}

function makePrivate(y) {
  demandPassphrase(y);

  return clusternatorJson
    .makePrivate(y.argv.p)
    .then(() => {
      util.info('Clusternator: Private files/directories encrypted');
    });
}

function readPrivate(y) {
  demandPassphrase(y);

  return clusternatorJson.readPrivate(y.argv.p).then(() => {
    util.info('Clusternator: Private files/directories un-encrypted');
  });
}

function generatePass() {
  return gpg.generatePass().then((passphrase) => {
    util.info('Keep this passphrase secure: ' + passphrase);
  }, (err) => {
    util.info('Error generating passphrase: ' + err.message);
  });
}

function safeParse(string) {
  try {
    return JSON.parse(string);
  } catch (err) {
    return null;
  }
}

/**
 * @param {ProjectManager} pm
 * @param {Object} cJson
 * @param {string} appDefStr
 * @param {string} deployment
 * @param {string} sha
 * @returns {Request|Promise.<T>}
 * @private
 */
function deploy_(pm, cJson, appDefStr, deployment, sha) {
  util.info('Requirements met, creating deployment...');
  var appDef = safeParse(appDefStr);
  if (!appDef) {
    throw new Error('Deployment failed, error parsing appDef');
  }
  return pm.createDeployment(
    cJson.projectId,
    deployment,
    sha,
    appDef
  ).then((result) => {
    util.info('Deployment will be available at ', result);
  });
}

function getAppDefNotFound(dPath) {
  return (err) => {
    util.info(`Deployment AppDef Not Found In: ${dPath}: ${err.message}`);
    throw err;
  };
}

function deploy(y) {
  var argv = y.demand('d').
  alias('d', 'deployment-name').
  describe('d', 'Requires a deployment name').
    argv;

  return clusternatorJson
    .get()
    .then((cJson) => {
      var dPath = path.join(cJson.deploymentsDir, argv.d + '.json');
      return Q
        .all([
          getProjectAPI(),
          git.shaHead(),
          readFile(dPath, UTF8)
            .fail(getAppDefNotFound(dPath))
        ])
        .then((results) => deploy_(
          results[0], cJson, results[2], argv.d, results[1]))
        .fail((err) => {
          util.info('Clusternator: Error creating deployment: ' + err.message);
          util.info(err.stack);
        });
    });
}

function stop(y) {
  var argv = y.demand('d').
  alias('d', 'deployment-name').
  describe('d', 'Requires a deployment name').
  alias('s', 'SHA (git hash)').
  default('s', '', 'HEAD').
  describe('s', 'Requires a SHA').
    argv;

  return clusternatorJson.get().then((cJson) => {
    return Q.all([
      getProjectAPI(),
      git.shaHead()
    ]).then((results) => {
      var sha = argv.s || results[1];
      util.info('Stopping Deployment...: ', cJson.projectId, ': ', argv.d,
        ' sha: ', sha);
      return results[0].destroyDeployment(
        cJson.projectId,
        argv.d,
        sha
      );
    }).fail((err) => {
      util.info('Clusternator: Error stopping deployment: ' + err.message);
      util.info(err.stack);
    });
  });
}

function generateDeployment(y) {
  var argv = y.demand('d').
  alias('d', 'deployment-name').
  describe('d', 'Requires a deployment name').
    argv;

  return generateDeploymentFromName(argv.d);
}

function describeServices() {
  return getProjectAPI().then((pm) => {
    return clusternatorJson.get().then((config) => {
      return pm.describeProject(config.projectId)
        .then((desc) => {
          util.info(JSON.stringify(desc, null, 2));
        });
    });
  }).done();
}

function listProjects() {
  return getProjectAPI().then((pm) => {
    return pm.listProjects().then((projectNames) => {
      projectNames.forEach((name) => {
        console.log(name);
      });
    });
  }).done();
}

function describe(y) {
  y.demand('p')
    .alias('p', 'pull-request')
    .default('p', 'all', 'All pull requests')
    .describe('p', 'Limits the description to a pull request')
    .demand('r')
    .alias('r', 'resource')
    .default('r', 'all', 'All resource types')
    .choices('r', ['all', 'securityGroups', 'instances', 'services'])
    .describe('r', 'Limits the description to a resource type');

  if (y.argv.p !== 'all') {
    util.info('Describing resources associated to pr #' + y.argv.p);
  } else {
    util.info('Describing *all* resources in use');
  }
}

function newSSH(y) {
  var argv = y.demand('n').
  alias('n', 'name').
  describe('n', 'Creates a new SSH key with the provided name.  The keypair ' +
    'are stored in ~/.ssh, and the public key is installed into the project').
    argv;

  return clusternatorJson.findProjectRoot().then((root) => {
    var publicPath = path.join(root, '.private', constants.SSH_PUBLIC_PATH);
    return mkdirp(publicPath).then(() => {
      return sshKey(argv.n, publicPath);
    });
  });
}

function dockerBuild(y) {
  var id = (+Date.now()).toString(16),
    argv = demandPassphrase(y)
      .demand('i')
      .alias('i', 'image')
      .describe('i', 'Name of the docker image to create')
      .default('i', id)
      .argv;

  util.info('Building Docker Image: ', argv.i);

  util.verbose('Encrypting Private Folder');
  return makePrivate(y).then(() => {
    return clusternatorJson
      .findProjectRoot()
      .then((root) => {
        var output, outputError;
        process.chdir(root);
        util.info('Start Docker Build', argv.i);
        return docker.build(argv.i)
          .progress((data) => {
            if (!data) { return; }
            if (data.error) {
              outputError += data.error;
              util.error(outputError);
            }
            if (data.data) {
              output += data.data;
              util.verbose(output);
            }
          });
      })
      .then(() => {
        util.verbose('Decrypting Private Folder');
        return readPrivate(y);
      })
      .then(() => {
        util.info('Built Docker Image: ', argv.i);
      })
      .fail((err) => {
        util.warn('Docker failed to build: ', err.message);
        return readPrivate(y);
      });
  }).fail((err) => {
    util.error('Error building local Docker image: ', err);
  }).done();
}

function getPrivateChecksumPaths() {
  return Q.all([
      clusternatorJson.get(),
      clusternatorJson.findProjectRoot() ])
    .then((results) => {
      const privatePath = results[0].private,
        checksumPath = path.join(results[1], results[0].clusternatorDir,
          PRIVATE_CHECKSUM);
      return {
        priv: privatePath,
        checksum: checksumPath,
        clusternator: results[0].clusternatorDir,
        root: results[1]
      };
    });
}

function privateChecksum() {
  return getPrivateChecksumPaths()
    .then((paths) => {
      return mkdirp(paths.clusternator).then(() => paths);
    }).then((paths) => {
      process.chdir(paths.root);
      return paths;
    }).then((paths) =>shaDir
      .genSha(paths.priv)
      .then((sha) => writeFile(paths.checksum, sha)
        .then(() => util
          .info(`Generated shasum of ${paths.priv} => ${sha}`))))
    .done();
}

/**
 * @param {string} sha
 * @returns {Function}
 */
function getPrivateDiffFn(sha) {
  return (storedSha) => {
    if (sha.trim() === storedSha.trim()) {
      process.exit(0);
    }
    util.info(`Diff: ${sha.trim()} vs ${storedSha.trim()}`);
    process.exit(1);
  };
}

function privateDiff() {
  return getPrivateChecksumPaths()
    .then((paths) => shaDir
      .genSha(paths.priv)
      .then((sha) => readFile(paths.checksum, UTF8)
        .then(getPrivateDiffFn(sha))
        .fail(() => {
          // read file errors are expected
          util.info(`Diff: no checksum to compare against`);
          process.exit(2);
        })))
    .fail((err) => {
      // unexpected error case
      util.error(err);
      process.exit(2);
    })
    .done();
}

function configUser() {
  Config.interactiveUser().done();
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
  generateDeployment,

  deploy,
  stop,

  describeServices,
  listProjects,

  newSSH,
  dockerBuild,

  privateChecksum,
  privateDiff,

  configUser,
  logApp,
  logEcs,
  ssh: sshShell
};

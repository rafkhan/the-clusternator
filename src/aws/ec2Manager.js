'use strict';

const UTF8 = 'utf-8'
const SETUP_SSH = 'mkdir -p /home/ec2-user/.ssh';
const CHOWN_SSH ='chown -R ec2-user:ec2-user /home/ec2-user/.ssh && chmod -R ' +
  'go-rwx /home/ec2-user/.ssh';
const OUTPUT_SSH = '>> /home/ec2-user/.ssh/authorized_keys';

var Q = require('q'),
  R = require('ramda'),
  common = require('./common'),
  util = require('../util'),
  constants = require('../constants'),
  fs = require('fs'),
  path = require('path');

var ls = Q.nbind(fs.readdir, fs),
  readFile = Q.nbind(fs.readFile, fs),
  DEFAULT_INSTANCE_PARAMS = constants.AWS_DEFAULT_EC2;


//var DEFAULT_SECURITY_GROUP = 'sg-356bb652'; // Default SG allows all traffic

// NETWORK INTERFACE MUST HAVE MATCHING SECURITY GROUP
//var NETWORK_INTERFACE_ID = 'eni-66bd8349';

/**
 * Loads _all_ the contents of a given path, it assumes they're public keys
 * @param {string} keyPath
 * @returns {Q.Promise<string[]>}
 */
function loadUserPublicKeys(keyPath) {
  return ls(keyPath).then((keyFiles) => {
    return Q.all(keyFiles.map((fileName) => {
      return readFile(path.normalize(keyPath + path.sep + fileName), UTF8);
    }));
  });
}

/**
 * @param {string} type
 * @returns {string}
 */
function makeDockerAuthType(type) {
  return `echo ECS_ENGINE_AUTH_TYPE=${ type } >> /etc/ecs/ecs.config;`
}

/**
 * @param {string} data
 * @returns {string}
 */
function makeDockerAuthData(data) {
  return `echo ECS_ENGINE_AUTH_DATA=${ data } >> /etc/ecs/ecs.config;`
}

/**
 * @todo sort out docker auth for private images
 * @param {string} cfg
 * @returns {string[]}
 */
function makeDockerAuthCfg(cfg) {
  if (!cfg) {
    throw new TypeError('Clusternator Ec2: makeDockerAuthCfg requires a param');
  }
  const cfgType = 'dockercfg';
  return [
    makeDockerAuthType(cfgType),
    makeDockerAuthData(cfg)
  ];
}


/**
 * @todo sort out docker auth for private images
 * @param {{ username: string, password: string, email: string }}auth
 * @return {string[]}
 * @throws {TypeError}
 */
function makeDockerAuth(auth) {
  if (!auth || !auth.username || !auth.password || !auth.email) {
    throw new TypeError('Clusternator: Ec2: Auth should contain a ' +
      'username, password, and email');
  }
  const cfgType = 'docker';

  var authJson = {
    'https://index.docker.io/v1/user': auth
  }, authStr = JSON.stringify(authJson);

  return [
    makeDockerAuthType(cfgType),
    makeDockerAuthData(authStr)
  ];
}

/**
 * @param {string[]} keys
 * @returns {string[]}
 */
function processSSHKeys(keys) {
  if (!keys.length) {
    return [];
  }
  return [SETUP_SSH].concat(keys.map((key) => {
    return `echo "\n' ${key}" ${OUTPUT_SSH}`;
  }).concat(CHOWN_SSH));
}

/**
 * @param {string} sshPath to user defined ssh public keys
 * @returns {Q.Promise<string[]>}
 */
function makeSSHUserData(sshPath) {
  return loadUserPublicKeys(sshPath).then(processSSHKeys);
}


/**
 * @param {string[]} arr
 * @return {string}
 */
function stringArrayToNewLineBase64(arr) {
  var buf = new Buffer(arr.join('\n'));
  return buf.toString('base64');
}

/**
 * @param {string} clusterName
 * @param {{ username: string, password: string, email:string}|{cfg:string}} auth
 * @param sshPath
 * @returns {Q.Promise<string>}
 */
function getECSContainerInstanceUserData(clusterName, auth, sshPath) {
  var data = ['#!/bin/bash',
    'echo ECS_CLUSTER=' + clusterName + ' >> /etc/ecs/ecs.config;'
  ], authData = [];

  if (auth) {
    if (auth.cfg) {
      authData = makeDockerAuthCfg(auth.cfg);
    } else {
      authData = makeDockerAuth(auth);
    }
  }

  data = data.concat(authData);

  return makeSSHUserData(sshPath).then((sshData) => {
    data = data.concat(sshData);
    return stringArrayToNewLineBase64(data);
  }, (err) => {
    util.plog('Clusternator Ec2: Warning: Loading user defined SSH keys ' +
      'failed, custom logins disabled ' + err.message);
    return stringArrayToNewLineBase64(data);
  });
}


function getEC2Manager(ec2, vpcId) {
  ec2 = util.makePromiseApi(ec2);

  var baseFilters = constants.AWS_FILTER_CTAG.concat(
    common.makeAWSVPCFilter(vpcId)),
    describe = common.makeEc2DescribeFn(
      ec2, 'describeInstances', 'Reservations', baseFilters);

  function tagInstance(instance, pr, pid) {
    return common.awsTagEc2(ec2, instance.InstanceId, [{
      Key: constants.CLUSTERNATOR_TAG,
      Value: 'true'
    }, {
      Key: constants.PR_TAG,
      Value: pr
    }, {
      Key: constants.PROJECT_TAG,
      Value: pid
    }]);
  }




  /**
   *  @param {string[]|string} instanceIds
   */
  function checkInstanceStatuses(instanceIds) {
    if (!Array.isArray(instanceIds)) {
      instanceIds = [instanceIds];
    }
    if (!instanceIds.length) {
      throw 'No instance IDs';
    }

    var params = {
      InstanceIds: instanceIds
    };

    return ec2.describeInstances(params).then(function(list) {
      if (!list.Reservations.length) {
        return [];
      }

      var res = list.Reservations[0].Instances;
      return res.map((reservation) => {
        return {
          InstanceId: reservation.instanceIds,
          State: reservation.State,
          Tags: reservation.Tags
        };
      });
    });
  }

  function makeTerminatedPredicate(instanceIds) {
    function predicate() {
      return checkInstanceStatuses(instanceIds).then((list) => {
        if (!list.length) {
          throw new Error('Ec2 Could not wait for ' + instanceIds.join(', ') +
            ' to terminate, they were not found');
        }
        if (list[0].State.Name === 'terminated') {
          util.plog('Ec2: Instances ' + instanceIds.join(', ') + ' Terminated');
          return true;
        } else {
          throw new Error('Ec2: Not Yet Terminated');
        }
      });
    }
    return predicate;
  }

  function makeReadyPredicate(instanceId) {
    function predicate() {
      return checkInstanceStatuses([instanceId]).then((list) => {
        var d;
        if (!list.length) {
          throw new Error('Ec2 No Instances Awaiting Readiness');
        }
        if (list[0].State.Name === 'running') {
          util.plog('Ec2 Is Ready');
          return true;
        } else {
          throw new Error('Ec2: Wait For Readiness');
        }
      });
    }
    return predicate;
  }

  /**
   @param {string} instanceId
   */
  function waitForReady(instanceId) {
    var fn = makeReadyPredicate(instanceId);

    return util.waitFor(fn, constants.AWS_EC2_POLL_INTERVAL,
      constants.AWS_EC2_POLL_MAX);
  }

  /**
   * @param config Object
   * config will merge with default ec2 config
   */
  function buildEc2Box(config) {
    if (!config) {
      throw new TypeError('This function requires a configuration object');
    }

    var clusterName = config.clusterName;
    if (!config.clusterName) {
      throw new TypeError('Instance requires cluster name');
    }
    if (!config.sgId) {
      throw new TypeError('Instance Requires sgId Group Id');
    }
    if (!config.subnetId) {
      throw new TypeError('Instance Requires subnetId Id');
    }
    if (!config.pid) {
      throw new TypeError('Instance Requires a pid');
    }
    if (!config.pr) {
      throw new TypeError('Instance Requires a pr #');
    }

    var auth = config.auth;
    var apiConfig = config.apiConfig;
    var sshPath = '';
    return getECSContainerInstanceUserData(clusterName, auth, sshPath).then((data) => {
      apiConfig.UserData = data;

      var params = R.merge(DEFAULT_INSTANCE_PARAMS, apiConfig);

      params.NetworkInterfaces.push({
        DeviceIndex: 0,
        AssociatePublicIpAddress: true,
        SubnetId: config.subnetId,
        DeleteOnTermination: true,
        Groups: [config.sgId]
      });

      return ec2.runInstances(params).then((results) => {
        var tagPromises = [],
          readyPromises = [];
        results.Instances.forEach(function(instance) {
          tagPromises.push(tagInstance(instance, config.pr, config.pid));
          readyPromises.push(waitForReady(instance.InstanceId));
        });
        return Q.all(tagPromises.concat(readyPromises)).then(() => {
          return describe(config.pid, config.pr);
        });
      });
    });

  }

  /**
   @param {string[]} instanceIds
   */
  function waitForTermination(instanceIds) {
    var fn = makeTerminatedPredicate(instanceIds);

    return util.waitFor(fn, constants.AWS_EC2_POLL_INTERVAL,
      constants.AWS_EC2_POLL_MAX);
  }

  /**
   @param {string[]} instanceIds
   */
  function stopAndTerminate(instanceIds) {
    return ec2.stopInstances({
      InstanceIds: instanceIds
    }).then(() => {
      return ec2.terminateInstances({
        InstanceIds: instanceIds
      });
    }).then(() => {
      return waitForTermination(instanceIds);
    });
  }

  function destroyPr(pid, pr) {
    if (!pid || !pr) {
      throw new TypeError('ec2 destroy requires pid, and pr');
    }

    return describe(pid, pr).then((list) => {
      if (!list.length) {
        common.throwInvalidPidPrTag(pid, pr, 'looking', 'Instance');
      }

      return stopAndTerminate(list[0].Instances.map((el) => {
        return el.InstanceId;
      }));
    });
  }

  return {
    createPr: buildEc2Box,
    describe,
    destroyPr,
    checkInstanceStatuses,
    helpers: {
      checkInstanceStatuses,
      getECSContainerInstanceUserData,
      loadUserPublicKeys,
      makeDockerAuth,
      makeDockerAuthCfg,
      makeReadyPredicate,
      makeSSHUserData,
      makeTerminatedPredicate,
      processSSHKeys,
      stringArrayToNewLineBase64,
      SETUP_SSH,
      CHOWN_SSH,
      OUTPUT_SSH
    }
  };
}


module.exports = getEC2Manager;

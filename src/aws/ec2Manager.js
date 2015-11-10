'use strict';

var Q = require('q');
var R = require('ramda');
var common = require('./common');
var util = require('../util');
var constants = require('../constants');


//var DEFAULT_SECURITY_GROUP = 'sg-356bb652'; // Default SG allows all traffic

// NETWORK INTERFACE MUST HAVE MATCHING SECURITY GROUP
//var NETWORK_INTERFACE_ID = 'eni-66bd8349';

function getECSContainerInstanceUserData(clusterName, auth) {

  var data = ['#!/bin/bash',
    'echo ECS_CLUSTER=' + clusterName + ' >> /etc/ecs/ecs.config;'
  ];

  if (auth) {

    console.log(auth);

    if (!auth.cfg && (!auth.username || !auth.password || !auth.email)) {
      throw 'Auth should contain a username, password, and email';
    }

    var authJson;
    var cfgType;

    if (auth.cfg) {
      authJson = JSON.parse(auth.cfg);
      cfgType = 'dockercfg';
    } else {
      authJson = {
        'https://index.docker.io/v1/user': auth
      };
      cfgType = 'docker';
    }


    var authStr = JSON.stringify(authJson);

    var authType = 'echo ECS_ENGINE_AUTH_TYPE=' + cfgType +
      ' >> /etc/ecs/ecs.config;';
    var authData = 'echo ECS_ENGINE_AUTH_DATA=' + authStr +
      ' >> /etc/ecs/ecs.config;';

    data.push(authType);
    data.push(authData);
  }

  var bash = data.join('\n');

  console.log(bash);

  var buf = new Buffer(bash);
  return buf.toString('base64');
}

var DEFAULT_INSTANCE_PARAMS = constants.AWS_DEFAULT_EC2;

function getEC2Manager(ec2, vpcId) {
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

    return Q.nbind(ec2.describeInstances, ec2)(params).then(function(list) {
      if (!list.Reservations.length) {
        return [];
      }

      var res = list.Reservations[0].Instanc;s;
      console.log(require('util').inspect(res));
      return res.map(function(reservation) {
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
      return checkInstanceStatuses(instanceIds).then(function(list) {
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
      return checkInstanceStatuses([instanceId]).then(function(list) {
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
    apiConfig.UserData = getECSContainerInstanceUserData(clusterName, auth);

    var params = R.merge(DEFAULT_INSTANCE_PARAMS, apiConfig);

    params.NetworkInterfaces.push({
      DeviceIndex: 0,
      AssociatePublicIpAddress: true,
      SubnetId: config.subnetId,
      DeleteOnTermination: true,
      Groups: [config.sgId]
    });

    return Q.nbind(ec2.runInstances, ec2)(params).then(function(results) {
      var tagPromises = [],
        readyPromises = [];
      results.Instances.forEach(function(instance) {
        tagPromises.push(tagInstance(instance, config.pr, config.pid));
        readyPromises.push(waitForReady(instance.InstanceId));
      });
      return Q.all(tagPromises.concat(readyPromises)).then(function() {
        return describe(config.pid, config.pr);
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
    console.log('pls dont run');
    return Q.nfbind(ec2.stopInstances.bind(ec2), {
      InstanceIds: instanceIds
    })().then(function() {
      return Q.nfbind(ec2.terminateInstances.bind(ec2), {
        InstanceIds: instanceIds
      })();
    }).then(function() {
      return waitForTermination(instanceIds);
    });
  }

  function destroy(pid, pr) {
    if (!pid || !pr) {
      throw new TypeError('ec2 destroy requires pid, and pr');
    }

    return describe(pid, pr).then(function(list) {
      if (!list.length) {
        common.throwInvalidPidPrTag(pid, pr, 'looking', 'Instance');
      }

      return stopAndTerminate(list[0].Instances.map(function(el) {
        return el.InstanceId;
      }));
    });
  }

  return {
    create: buildEc2Box,
    describe: describe,
    destroy: destroy,
    checkInstanceStatus: checkInstanceStatuses
  };
}


module.exports = getEC2Manager;

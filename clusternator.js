'use strict';

var AWS = require('aws-sdk');

//var EC2Manager = require('./lib/ec2Manager');
//var ClusterManager = require('./lib/clusterManager');

var AWS_REGION = 'us-east-1';
AWS.config.region = AWS_REGION;

//var ec2 = new AWS.EC2();
//var ec2Manager = EC2Manager(ec2);

//var instanceConfig = {
  //clusterName: 'CLUSTERNATOR',

  //// API config is merged directly into the API call
  //apiConfig: {
    //KeyName: 'project-augury-test-1-ecs-ami-us-east-1',
    //// XXX ENSURE IDEMPOTENCY, this needs to be different for every request
    //ClientToken: '5' //(new Date()).valueOf().toString()
  //}
//};

//ec2Manager.createEC2Instance(instanceConfig)
          //.then(function(data) {
                //console.log(data);
              //}, function(err) {
                //console.log(err);
              //});


//var ecs = new AWS.ECS();
//var clusterManager = ClusterManager(ecs);
//clusterManager.createCluster()
              //.then(function(data) {
                //console.log(data);
              //}, function(err) {
                //console.log(err);
              //});

setTimeout(function(){}, 1000);


var R = require('ramda');
var aws = require('aws-sdk');
var iamWrap = require('./lib/aws/iam/iam');
var docs = require('./lib/aws/iam/role-policy-documents');
const util = require('./lib/util');

function iamAwsPartial(fn) {
  return R.partial(fn, { iam: util.makePromiseApi(new aws.IAM()) });
}

var iam = R.mapObjIndexed(iamAwsPartial, iamWrap);

var name = 'ecsInstanceRole' //Date.now().toString();


iam.createInstanceRole(name, docs.ec2TrustPolicy, docs.ec2EcsPolicy)
  .then(util.info, util.error);

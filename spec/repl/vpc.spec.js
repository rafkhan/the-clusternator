var setup = require('./setup'),
VPC = require(setup.path('aws', 'vpcManager.js'));

module.exports = VPC(setup.getEc2());

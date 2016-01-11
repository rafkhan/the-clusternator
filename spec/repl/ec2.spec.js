var setup = require('./setup'),
EC2 = require(setup.path('aws', 'ec2Manager.js'));

module.exports = EC2(setup.getEc2(), setup.testVPC);

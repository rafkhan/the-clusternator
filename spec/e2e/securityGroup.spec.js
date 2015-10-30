var setup = require('./setup'),
SG = require(setup.path('aws', 'securityGroupManager.js'));

module.exports = SG(setup.getEc2(), setup.testVPC);

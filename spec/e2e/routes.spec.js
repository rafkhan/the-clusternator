var setup = require('./setup'),
Route = require(setup.path('aws', 'routeTableManager.js'));

module.exports = Route(setup.getEc2(), setup.testVPC);

var setup = require('./setup'),
PR = require(setup.path('prManager.js'));

module.exports = PR(
  setup.getEc2(), setup.getEcs(), setup.getRoute53(), setup.testVPC
);

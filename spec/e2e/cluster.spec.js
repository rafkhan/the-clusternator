var setup = require('./setup'),
Cluster = require(setup.path('aws', 'clusterManager.js'));

module.exports = Cluster(setup.getEcs(), setup.testVPC);

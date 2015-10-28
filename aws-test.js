var aws = require('aws-sdk'),
    c = require('./src/config');

c.init();

module.exports = {
   ec2: new aws.EC2(c.credentials)
};

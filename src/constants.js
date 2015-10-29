const CLUSTERNATOR_PREFIX = 'clusternator';
const DELIM = '-';
const CLUSTERNATOR_TAG = CLUSTERNATOR_PREFIX + DELIM + 'created';
const PROJECT_TAG = CLUSTERNATOR_PREFIX + DELIM + 'project';

var constants = Object.freeze({
  AWS_DEFAULT_EC2_AMI: 'ami-8da458e6',
  AWS_DEFAULT_EC2_TYPE: 't2.micro',
  AWS_FILTER_CTAG: [
    {
      Name: 'tag-key',
      Values: [
        CLUSTERNATOR_TAG
      ]
    }
  ],
  CLUSTERNATOR_PREFIX: CLUSTERNATOR_PREFIX,
  CLUSTERNATOR_TAG: CLUSTERNATOR_TAG,
  PROJECT_TAG: PROJECT_TAG,
});

module.exports = constants;

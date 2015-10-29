const CLUSTERNATOR_PREFIX = 'clusternator';
const DELIM = '-';
const CLUSTERNATOR_TAG = CLUSTERNATOR_PREFIX + DELIM + 'created';
const PROJECT_TAG = CLUSTERNATOR_PREFIX + DELIM + 'project';

var constants = Object.freeze({
  CLUSTERNATOR_TAG: CLUSTERNATOR_TAG,
  PROJECT_TAG: PROJECT_TAG,
  AWS_FILTER_CTAG: [
      {
        Name: 'tag-key',
        Values: [
            CLUSTERNATOR_TAG
        ]
     }
    ]
});

module.exports = constants;

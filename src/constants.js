const CLUSTERNATOR_TAG = 'made-with-clusternator';

var constants = Object.freeze({
  CLUSTERNATOR_TAG: CLUSTERNATOR_TAG,
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

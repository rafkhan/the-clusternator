#!/usr/bin/env node


'use strict';

/** @todo get this from settings */
var API = '0.0.1';

var yargs = require('yargs');

require('../lib/api/' + API + '/cli/cli-api')(yargs);
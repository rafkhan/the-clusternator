#!/usr/bin/env node

'use strict';

const USER = require('../lib/config')().user;
const API = USER ?
    USER.apiVersion : require('../lib/constants').DEFAULT_API_VERSION;

const yargs = require('yargs');

require(`../lib/api/${API}/cli/cli-api`)(yargs);


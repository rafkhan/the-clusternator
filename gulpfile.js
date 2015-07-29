'use strict';

var gulp = require('gulp');
var argv = require('yargs').argv;

var clusternatorCLI = require('./lib/cli');

/*
 * Creates new version of app
 */
gulp.task('clusternator:new-app',     function(){});
gulp.task('clusternator:update-app',  clusternatorCLI.updateApp(argv));
gulp.task('clusternator:destroy-app', function(){});


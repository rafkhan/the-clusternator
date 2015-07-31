'use strict';

var gulp = require('gulp');
var argv = require('yargs').argv;

var clusternatorCLI = require('./lib/cli');

gulp.task('clusternator:app:new',     clusternatorCLI.newApp(argv));
gulp.task('clusternator:app:update',  clusternatorCLI.updateApp(argv));
gulp.task('clusternator:app:destroy', function(){});

gulp.task('clusternator:ec2:new', clusternatorCLI.newEC2Instance(argv));

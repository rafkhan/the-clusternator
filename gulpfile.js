'use strict';

var gulp = require('gulp');
var argv = require('yargs').argv;

var cli = require('./lib/cli');

gulp.task('clusternator:app:new',     cli.newApp(argv));
gulp.task('clusternator:app:update',  cli.updateApp(argv));
gulp.task('clusternator:app:destroy', function(){});

gulp.task('clusternator:ec2:new', cli.newEC2Instance(argv));

gulp.task('clusternator:server:start', cli.startServer(argv));

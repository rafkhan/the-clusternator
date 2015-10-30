'use strict';

var gulp = require('gulp'),
babel = require('gulp-babel'),
eslint = require('gulp-eslint'),
mocha = require('gulp-mocha'),
istanbul = require('gulp-istanbul');

var jsPaths = ['src/**/*.js'],
specPaths = ['spec/unit/**/*.spec.js'];

gulp.task('default', ['transpile']);
gulp.task('test', ['test-unit']);

gulp.task('transpile', function transpile() {
  return gulp.src(jsPaths).
  pipe(babel()).
  pipe(gulp.dest('lib'));
});

gulp.task('watch', function watch() {
  gulp.watch(jsPaths, ['transpile']);
});

gulp.task('pre-test-unit', ['lint'], function preUnitTest() {
  return gulp.src(jsPaths).pipe(istanbul()).
  pipe(istanbul.hookRequire());
});

gulp.task('test-unit', ['pre-test-unit'], function testUnit() {
    return gulp.src(specPaths).
    pipe(mocha()).
    pipe(istanbul.writeReports());
});

gulp.task('lint', function lint() {
  return gulp.src(jsPaths.concat(specPaths)).
  pipe(eslint()).
  pipe(eslint.format()).
  pipe(eslint.failAfterError());
});

'use strict';

var gulp = require('gulp');
var babel = require('gulp-babel');
var eslint = require('gulp-eslint');
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');
var istanbul = require('gulp-istanbul');
var gutil = require('gulp-util');
var spawn = require('child_process').spawn;

var jsPaths = ['src/**/*.js'];
var cliPath = ['bin-src/**/*.js'];
var specPaths = ['spec/unit/**/*.spec.js', 'src/**/*.spec.js'];

gulp.task('default', ['transpile']);
gulp.task('test', ['test-unit']);

gulp.task('jsdoc', function jsDoc() {
  // Finally execute your script below - here 'ls -lA'
  var child = spawn('npm', ['run', 'doc-api'], {cwd: process.cwd()});

  child.stdout.setEncoding('utf8');

  child.stdout.on('data', function (data) {
    gutil.log(data);
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', function (data) {
    gutil.log(gutil.colors.red(data));
    gutil.beep();
  });

  child.on('close', function(code) {
    gutil.log('Done with JSDoc exit code', code);
  });
});

gulp.task('transpile', ['transpile-cli', 'transpile-src']);

gulp.task('transpile-cli', function transpileCli() {
  return gulp.src(cliPath)
    .pipe(babel())
    .pipe(gulp.dest('bin'));
});

gulp.task('transpile-src', function transpileSrc() {
  return gulp.src(jsPaths)
    .pipe(plumber())
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});

gulp.task('watch', function watch() {
  gulp.watch(jsPaths, ['transpile', 'jsdoc']);
});

gulp.task('watch-tests', function watch() {
  gulp.watch(jsPaths.concat(specPaths), ['test-unit']);
});

gulp.task('pre-test-unit', function preUnitTest() {
  return gulp
    .src(jsPaths)
    .pipe(istanbul({
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test-unit', ['lint', 'pre-test-unit'], function testUnit() {
  return gulp
    .src(specPaths)
    .pipe(mocha())
    .pipe(istanbul.writeReports({
      reporters: ['text', 'lcovonly', 'html', 'json', 'text-summary'],
      reportOpts: {
        dir: './coverage',
        lcov: {
          dir: 'coverage/lcovonly',
          file: 'lcov.info'
        },
        html: {
          dir: 'coverage/html'
        },
        json: {
          dir: 'coverage/json'
        }
      }
    }));
});

gulp.task('lint', function lint() {
  return gulp.src(jsPaths.concat(specPaths))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

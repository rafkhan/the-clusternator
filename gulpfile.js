'use strict';

var gulp = require('gulp'),
babel = require('gulp-babel');

gulp.task('default', ['transpile']);

gulp.task('transpile', function () {
  return gulp.src('src/**/*.js').
    pipe(babel()).
    pipe(gulp.dest('lib'));
});

gulp.task('watch', function () {
  gulp.watch('src/**/*.js', ['transpile']);
});

(function (require) {

    'use strict';

    var gulp = require('gulp'),
        minify = require('gulp-uglify'),
        cleanCss = require('gulp-clean-css'),
        jshint = require('gulp-jshint'),
        concat = require('gulp-concat'),
        notify = require('gulp-notify'),
        sourceMaps = require('gulp-sourcemaps'),
        config = require('./gulpConfig.json'),
        map = require('map-stream'),
        minifiedFile = 'app.min.js',
        concatConfig = {newLine: '\n;'},
        minifiedCss = 'app.min.css';

    function customReporter() {
        return map(function (file, cb) {
            if (!file.jshint.success) {
                file.jshint.results.forEach(function (err) {
                    if (err) {
                        console.log(' '+err.file + ':' + err.error.line + '\n\tReason: ' + err.error.reason + '\n\tEvidence: ' + err.error.evidence);
                    }
                });
            }
            cb(null, file);
        });
    }

    function compileJs(cfg) {
        return gulp.src(cfg.src.js)
            .pipe(jshint())
            .pipe(customReporter())
            // .on('error', notify.onError("JSHint Error: <%= error.message %>"))
            .pipe(sourceMaps.init())
            .pipe(minify())
            .on('error', notify.onError("Error: <%= error.message %>"))
            .pipe(concat(minifiedFile), concatConfig)
            .pipe(sourceMaps.write())
            .pipe(gulp.dest(cfg.folder))
            .on('finish', function() { console.log("Safe to refresh"); });
    }

    function compileCss(cfg) {
        return gulp.src(cfg.src.css)
            .pipe(concat(minifiedCss))
            .pipe(cleanCss())
            .pipe(gulp.dest(cfg.folder));
    }

    gulp.task('js', function () {
        compileJs(config.dev);
    });

    gulp.task('css', function () {
        compileCss(config.dev);
    });

    gulp.task('watch', function() {
        function callback(event) {
            console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
        }

        gulp.watch('civic-graph.module.js', ['js']).on('change', callback);
        gulp.watch('js/**/*.js', ['js']).on('change', callback);
        gulp.watch('css/**/*.css', ['css']).on('change', callback);
    });

    gulp.task('default', ['js', 'css'], function () {

    });
})(require);

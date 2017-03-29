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
        ejs = require('gulp-ejs'),
        ext_replace = require('gulp-ext-replace'),
        dir = require('node-dir'),
        hashFiles = require('hash-files'),
        templateCache = require('gulp-angular-templatecache'),
        minifiedFile = 'app.min.js',
        concatConfig = {newLine: '\n;'},
        minifiedCss = 'app.min.css';

    function compileJs(cfg) {
        return gulp.src(cfg.src.js)
            .pipe(jshint())
            .pipe(jshint.reporter('fail'))
            .on('error', notify.onError("JSHint Error: <%= error.message %>"))
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

    function compileEjs(cfg) {
      var hashes = {};

      dir.files(cfg.folder, function(err, files) {
        if (err) throw err;

        files.forEach(function(file) {
          hashes[file] = hashFiles.sync({ files: file }).slice(0, 7);
        });
      });

      return gulp.src(cfg.src.ejs)
                 .pipe(ejs({ hashes: hashes }))
                 .pipe(ext_replace('.html'))
                 .pipe(gulp.dest('./'))
    }

    function compileTemplateCache(cfg) {
        return gulp.src(cfg.src.templateCache)
                   .pipe(templateCache('templateCache.js', {
                     module: 'templateCache',
                     moduleSystem: 'IIFE',
                     root: 'js/',
                     standalone: true
                   }))
                   .pipe(gulp.dest(cfg.folder));
    }

    gulp.task('js', function () {
        compileJs(config.dev);
    });

    gulp.task('css', function () {
        compileCss(config.dev);
    });

    gulp.task('ejs', function () {
        compileEjs(config.dev);
    });

    gulp.task('templateCache', function () {
        compileTemplateCache(config.dev);
    });

    gulp.task('watch', function() {
        function callback(event) {
            console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
        }

        gulp.watch('civic-graph.module.js', ['js']).on('change', callback);
        gulp.watch('js/**/*.js', ['js']).on('change', callback);
        gulp.watch('css/**/*.css', ['css']).on('change', callback);
        gulp.watch('js/**/*.html', ['templateCache']).on('change', callback);
        gulp.watch(['*.ejs', 'build/*'], ['ejs']).on('change', callback);
    });

    gulp.task('default', ['js', 'css', 'templateCache', 'ejs'], function () {

    });
})(require);

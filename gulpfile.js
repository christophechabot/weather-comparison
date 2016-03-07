"use strict";

var gulp = require("gulp");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var sass = require("gulp-sass");
var sourcemaps = require("gulp-sourcemaps");
var del = require("del");
var browserSync = require("browser-sync").create();
var autoprefixer = require("gulp-autoprefixer");
var runSequence = require("run-sequence");
var gulpif = require("gulp-if");


var production_path = "./production/";
var development_path = "./development/";

var path = development_path;

var others_path = ["src/.htaccess", "src/favicon.ico"];



gulp.task("concatJS", function() {
    
    return gulp.src(["src/js/jquery.js", "node_modules/angular/angular.min.js", "node_modules/d3/d3.min.js", "src/js/app.js"] )
	.pipe(gulpif(path == development_path, sourcemaps.init()))
	.pipe(concat("app.js"))
	.pipe(gulpif(path == development_path, sourcemaps.write()))
	.pipe(gulp.dest(path + "js"));
});


gulp.task("uglifyJS", ["concatJS"], function() {
    return gulp.src(path + "js/*.js")
	.pipe(gulpif(path == development_path, sourcemaps.init()))
	.pipe(uglify())
	.pipe(gulpif(path == development_path, sourcemaps.write()))
	.pipe(gulp.dest(path + "js"));
});



gulp.task("compileSass", function() {
    return gulp.src("src/scss/*.scss")
	.pipe(gulpif(path == development_path, sourcemaps.init()))
	.pipe(sass(gulpif(path == production_path, {outputStyle: "compressed"})).on("error", sass.logError))
	.pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
	.pipe(gulpif(path == development_path, sourcemaps.write()))
	.pipe(gulp.dest(path + "css"));
});


gulp.task("copyHTML", function() {
    return gulp.src("./src/*.html")
	.pipe(gulp.dest(path));
});


gulp.task("copyImg", function() {
    return gulp.src("src/img/*")
	.pipe(gulp.dest(path + "img"));
});


gulp.task("copyFonts", function() {
    return gulp.src("src/fonts/**/*")
	.pipe(gulp.dest(path + "fonts"));
});

gulp.task("copyInc", function() {
    return gulp.src("src/inc/**/*.php")
	.pipe(gulp.dest(path + "inc"));    
})

gulp.task("copyOthers", function() {
    return gulp.src(others_path)
	.pipe(gulp.dest(path));
});



gulp.task("copy", ["copyHTML", "copyImg", "copyFonts", "copyInc", "copyOthers"]);


gulp.task("watch", function() {  

    
    
    gulp.watch("src/js/**/*", ["concatJS"])
    
    gulp.watch("src/scss/**/*", ["compileSass"]);
    gulp.watch("src/*.html", ["copyHTML"]);
    gulp.watch("src/img/**/*", ["copyImg"]);
    gulp.watch("src/fonts/**/*", ["copyFonts"]);
    gulp.watch("src/inc/**/*", ["copyInc"]);
    gulp.watch(others_path, ["copyOthers"]);
    
   

});


gulp.task("compile",  function() {
    path = development_path;
    runSequence("clean", ["concatJS", "compileSass", "copy"]);
});

gulp.task("compile_production",  function() {
    path = production_path;
    runSequence("clean_production", ["uglifyJS", "compileSass", "copy"]);
});


gulp.task("clean", function() {
    return del(development_path);    
});

gulp.task("clean_production", function() {
    return del(production_path);    
});





gulp.task("default", ["watch"]);

module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);
	require('time-grunt')(grunt);

	var jsCustom = [
		'src/js/main.js',
		'tmp/html/geochart.tpl.js',
		'src/js/utils.js',
		'src/js/error-handling.js',
		'src/js/map.js'
	];

	function getHtmlPrefix() {
		var prefix = 'geochartjs.htmlTemplate = (function() {\n\n';
		prefix += '	"use strict";\n\n';
		return prefix;
	}
	function getHtmlSuffix() {
		var suffix = '\n	return {\n';
		suffix += '\		overlays: htmlTemplate[\'overlays.tpl.html\'],\n';
		suffix += '\		templates: htmlTemplate[\'templates.tpl.html\']';
		suffix += '\n	};\n\n})();\n';
		return suffix;
	}

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		minifyHtml: {
			options: {
				empty: true,
				loose: true,
				conditionals: true,
				quotes: true
			},
			prod: {
				files: [{
					expand: true,
					cwd: 'src/html/',
					src: ['*.html'],
					dest: 'tmp/html-not-concat',
				}]
			}
		},

		htmlConvert: {
			options: {
				quoteChar: '\'',
				module: 'htmlTemplate',
				prefix: getHtmlPrefix(),
				suffix: getHtmlSuffix(),
				indentGlobal: '	',
				indentString: '	'
			},
			dev: {
				options: {
					base: 'src/html/'
				},
				src: ['src/html/*.html'],
				dest: 'tmp/html/geochart.tpl.js'
			},
			prod: {
				options: {
					base: 'tmp/html-not-concat/'
				},
				src: ['tmp/html-not-concat/*.html'],
				dest: 'tmp/html/geochart.tpl.js'
			}
		},

		concat: {
			jsCustom: {
				src: jsCustom,
				dest: 'tmp/js/<%= pkg.name %>-<%= pkg.version %>.js'
			},
			css: {
				src: ['tmp/styles/*.css'],
				dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.css'
			}
		},

		jshint: {
			files: ['<%= concat.jsCustom.dest %>'],
			options: {
				globals: {
					jQuery: true
				}
			}
		},

		sass: {
			dist: {
				files: [{
					expand: true,
					cwd: 'src/scss',
					src: ['*.{scss,sass}'],
					dest: 'tmp/styles',
					ext: '.css'
				}]
			}
		},

		copy: {
			js: {
				src: '<%= concat.jsCustom.dest %>',
				dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
			}
		},

		clean: {
			dist: ['dist/'],
			tmp: ['tmp/']
		},

		uglify: {
			dist: {
				files: {
					'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': '<%= concat.jsCustom.dest %>'
				}
			}
		},

		autoprefixer: {
			options: {
				browsers: '> 2% in CH'
			},
			css: {
				src: 'dist/<%= pkg.name %>-<%= pkg.version %>.css'
			}
		},

		cssmin: {
			options: {
				keepSpecialComments: 0
			},
			target: {
				files: {
					'dist/<%= pkg.name %>-<%= pkg.version %>.min.css': 'dist/<%= pkg.name %>-<%= pkg.version %>.css'
				}
			}
		},

		watch: {
			options: {
				livereload: true
			},
			all: {
				files: ['src/**/*.*', 'example/*'],
				tasks: ['default']
			}
		},

		connect: {
			dist: {
				options: {
					port: 9000,
					base: '',
					open: 'http://<%= connect.dist.options.hostname %>:<%= connect.dist.options.port %>/example',
					hostname: 'localhost',
					livereload: true
				}
			}
		}

	});

	grunt.registerTask('default', [
		'clean',
		'htmlConvert:dev',
		'concat:jsCustom',
		'jshint',
		'copy:js',
		'sass',
		'concat:css',
		'autoprefixer',
		'clean:tmp'
	]);

	grunt.registerTask('productive', [
		'default',
		'minifyHtml:prod',
		'htmlConvert:prod',
		'concat:jsCustom',
		'uglify',
		'cssmin',
		'clean:tmp'
	]);

	grunt.registerTask('serve', [
		'default',
		'connect',
		'watch'
	]);
};
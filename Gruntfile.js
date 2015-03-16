module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

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

		htmlConvert: {
			options: {
				base: 'src/html/',
				quoteChar: '\'',
				module: 'htmlTemplate',
				prefix: getHtmlPrefix(),
				suffix: getHtmlSuffix(),
				indentGlobal: '	',
				indentString: '	'
			},
			htmlTemplate: {
				src: ['src/html/overlays.tpl.html', 'src/html/templates.tpl.html'],
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
					'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': '<%= copy.js.dest %>'
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
			all: {
				files: ['src/**/*.*'],
				tasks: ['default']
			}
		},

		connect: {
			options: {
				port: 9000,
				open: 'http://<%= connect.options.hostname %>:<%= connect.options.port %>/example',
				hostname: 'localhost'
			},
			dist: {
				options: {
					base: '',
					livereload: false
				}
			}
		}

	});

	grunt.registerTask('default', [
		'clean',
		'htmlConvert',
		'concat:jsCustom',
		'jshint',
		'copy:js',
		'uglify',
		'sass',
		'concat:css',
		'autoprefixer',
		'cssmin',
		'clean:tmp'
	]);

	grunt.registerTask('serve', [
		'default',
		'connect:dist',
		'watch'
	]);
};
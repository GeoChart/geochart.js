module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);
	require('time-grunt')(grunt);

	var jsCustom = [
		'src/js/head.js',
		'tmp/html/geochart.tpl.js',
		'src/js/map.js',
		'src/js/tail.js'
	];

	var libraries = [
		'bower_components/jquery/dist/jquery.min.js',
		'bower_components/jquery/dist/jquery.min.map',
		'bower_components/jquery-load-template/jquery-loadTemplate/jquery.loadTemplate-1.4.5.min.js',
		'bower_components/jScrollPane/script/jquery.mousewheel.js',
		'bower_components/jScrollPane/script/jquery.jscrollpane.min.js',
		'bower_components/jScrollPane/style/jquery.jscrollpane.css',
		'bower_components/d3/d3.min.js',
		'bower_components/topojson/topojson.js',
		'bower_components/moment/min/moment.min.js'
	];

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
				indentString: '	',
				rename: function(moduleName) {
					return moduleName.replace('.html', '');
				}
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
				options: {
					process: function(src, filepath) {
						if(filepath !== 'src/js/head.js' && filepath !== 'src/js/head.js') {
							var lines = [];
							src.split('\n').forEach(function(line) {
								return lines.push((line.length > 0 ? '	' : '') + line);
							});
							src = lines.join('\n');
						}
						return src;
					}
				},
				src: jsCustom,
				dest: 'tmp/js/<%= pkg.name %>.js'
			},
			css: {
				src: ['tmp/styles/*.css'],
				dest: 'dist/<%= pkg.name %>.css'
			}
		},

		jshint: {
			options: {
				curly: true,
				eqeqeq: true,
				unused: true,
				bitwise: true,
				forin: true,
				freeze: true,
				undef: true,
			},
			dev: {
				options: {
					globals: {
						// console is allowed in dev mode
						console: true,
						window: true,
						document: true,
						d3: true,
						jQuery: true,
						topojson: true,
						moment: true
					}
				},
				src: ['<%= concat.jsCustom.dest %>']
			},
			dist: {
				options: {
					globals: {
						window: true,
						document: true,
						d3: true,
						jQuery: true,
						topojson: true,
						moment: true
					}
				},
				src: ['<%= concat.jsCustom.dest %>']
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
			jsCustom: {
				src: '<%= concat.jsCustom.dest %>',
				dest: 'dist/<%= pkg.name %>.js'
			},
			libraries: {
				expand: true,
				flatten: true,
				src: libraries,
				dest: 'dist/lib/'
			},
			json: {
				expand: true,
				flatten: true,
				rename: function(dest, src) {
					var nameAndVersion = grunt.template.process('<%= pkg.name %>-');
					return dest + nameAndVersion + src;
				},
				src: ['src/json/*.json'],
				dest: 'dist/'
			},
			htmlExample: {
				expand: true,
				flatten: true,
				src: 'src/example/*',
				dest: 'dist/example/'
			}
		},

		clean: {
			dist: ['dist/'],
			tmp: ['tmp/']
		},

		uglify: {
			dist: {
				files: {
					'dist/<%= pkg.name %>.min.js': '<%= concat.jsCustom.dest %>'
				}
			}
		},

		autoprefixer: {
			options: {
				browsers: '> 2% in CH'
			},
			css: {
				src: 'dist/<%= pkg.name %>.css'
			}
		},

		csslint: {
			options: {
				"adjoining-classes": false,
				"box-model": false,
				"box-sizing": false,
				"compatible-vendor-prefixes": false,
				"fallback-colors": false,
				"vendor-prefix": false,
				"namespaced": false,
				"important": false,
				"font-sizes": false,
				"universal-selector": false,
				"qualified-headings": false,
				"outline-none": false
			},
			dist: {
				src: ['dist/*.css']
			}
		},

		cssmin: {
			options: {
				keepSpecialComments: 0
			},
			target: {
				files: {
					'dist/<%= pkg.name %>.min.css': 'dist/<%= pkg.name %>.css'
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
					base: 'dist/',
					open: 'http://<%= connect.dist.options.hostname %>:<%= connect.dist.options.port %>',
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
		'jshint:dev',
		'copy:jsCustom',
		'copy:libraries',
		'sass',
		'concat:css',
		'autoprefixer',
		'csslint',
		'copy:htmlExample',
		'copy:json',
		'clean:tmp'
	]);

	grunt.registerTask('productive', [
		'default',
		'minifyHtml:prod',
		'htmlConvert:prod',
		'concat:jsCustom',
		'jshint:dist',
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
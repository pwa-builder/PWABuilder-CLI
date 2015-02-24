'use strict';

module.exports = function (grunt) {
  // Show elapsed time at the end
  require('time-grunt')(grunt);
  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      gruntfile: {
        src: ['Gruntfile.js']
      },
      js: {
        src: ['*.js', 'lib/**/*.js']
      },
      test: {
        src: ['test/**/*.js']
      },
      teamcity: {
        options: {
          reporter: require('jshint-teamcity')
        },
        src: ['*.js', 'lib/**/*.js', 'test/**/*.js', 'Gruntfile.js']
      },
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: 'coverage/blanket'
        },
        src: ['test/**/*.js']
      },
      'html-cov': {
        options: {
          reporter: 'html-cov',
          quiet: true,
          captureFile: 'coverage.html'
        },
        src: ['lib/**/*.js']
      },
      // The travis-cov reporter will fail the tests if the
      // coverage falls below the threshold configured in package.json
      'travis-cov': {
        options: {
          reporter: 'travis-cov'
        },
        src: ['lib/**/*.js']
      },
      'teamcity-test': {
        options: {
          reporter: 'mocha-teamcity-reporter'
        },
        src: ['test/**/*.js']
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      js: {
        files: '<%= jshint.js.src %>',
        tasks: ['jshint:js', 'mochaTest']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'mochaTest']
      }
    }
  });

  grunt.registerTask('jshint-all', ['jshint:js', 'jshint:test', 'jshint:gruntfile']);
  grunt.registerTask('tests-all', ['mochaTest:test', 'mochaTest:html-cov', 'mochaTest:travis-cov']);

  grunt.registerTask('default', ['jshint-all', 'tests-all']);

  grunt.registerTask('teamcity-tests', ['mochaTest:teamcity-test']);
  grunt.registerTask('teamcity-jshint', ['jshint:teamcity']);

  grunt.registerTask('teamcity-build', ['teamcity-jshint', 'teamcity-tests']);
};

module.exports = function(grunt) {

    // 1. Общая конфигурация
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            options: {
                livereload: true
            },
            scripts: {
                files: [
                    'public/js/*.js'
                ],
                tasks: [
                    'process'
                ]
            }
        },
        concat: {
            dist: {
                src: [
                    'public/js/*.js'
                ],
                dest: 'public/js/build/production.js'
            }
        },
        uglify: {
            dist: {
                options: {
                    banner: '/*\n * Created by IPRIT (Aleksandr Belov)\n**/\n'
                },
                files: {
                    'public/js/build/prod.min.js': [
                        'public/js/build/production.js'
                    ]
                }
            }
        }

    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-newer');

    grunt.registerTask('process', [
        'newer:concat', 'uglify'
    ]);
    grunt.registerTask('default', [
        'concat', 'uglify', 'watch'
    ]);
};
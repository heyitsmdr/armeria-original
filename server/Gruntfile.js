module.exports = function(grunt) {
    // armeria configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: { report: 'gzip', banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n' },
            my_target: {
                files: [{ src: ['../html/engine.js', '../html/engine/*.js'], dest: '../html/engine.min.js' }]
            }
        },
        less: {
            options: { cleancss: true },
            files: { src: '../html/css/*.less', dest: '../html/css/style.min.css' }
        }
    });
    
    // load plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');

    // default tasks
    grunt.registerTask('default', ['uglify', 'less']);
}
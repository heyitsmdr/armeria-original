module.exports = function(grunt) {
    // armeria configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: { report: 'min', banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n' },
            my_target: {
                files: [{ src: ['../html/engine.js', '../html/engine/*.js'], dest: '../html/engine.min.js' }]
            }
        }
    });
    
    // load plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    
    // default tasks
    grunt.registerTask('default', ['uglify']);
}
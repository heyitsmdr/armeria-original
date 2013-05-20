Armeria
=======

This is the main repository for Armeria. Please keep everything secret unless told otherwise.

Local Development
-----------------

### Intro

For local development, we use [Vagrant](http://www.vagrantup.com). This allows us to replicate
the same testing environment on every computer. 

### Installation

Install Vagrant, clone the repo and run the following commands:

    vagrant box add precise32 http://files.vagrantup.com/precise32.box
    
### Working

Once you have Vagrant installed and the box added, you can initialize the development environment
by going to the git directory and running the following command:

    vagrant up

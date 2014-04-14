Armeria
=======

This is the main repository for Armeria. Please keep everything secret unless told otherwise.

Local Development
-----------------

### Requirements

* Git - http://git-scm.com
* Vagrant - http://vagrantup.com
* VirtualBox - http://virtualbox.org

### Intro

For local development, we use [Vagrant](http://www.vagrantup.com). This allows us to replicate
the same testing environment on every computer. For exposing the test environment with the internet,
so that others can test your local repo, we use [ngrok](https://ngrok.com).

### Setting Up Repo

The first thing you want to do is clone the `armeria` repo. You can do this by running:

    git clone git@github.com:ethryx/armeria.git
    
You then want to either create a new branch for your own work, or use our `sprint` branch.

To switch to the `sprint` branch, you can use:

    git checkout sprint

And to create a new branch, you can use:

    git branch <new branch name>

You should never work within the `master` branch as anything pushed to the `master` branch will be pushed
to the live website (and should only be done by Mike Du Russel).

### Pulling Updates From Master

Before you start adding features (and each time you sit down to work on the game), you will
want to pull in anything new added to the live version of the game. To do so, run the command:

    git checkout master
    git pull
    git checkout <your branch> (or sprint)
    git merge master
    
## Pulling Updates From Sprint

When updates were made to the `sprint` branch, you can pull those in by running:

    git checkout sprint
    git pull

### Working

Once Vagrant is installed and the repo is cloned, run the following commands:

    vagrant up

The first time you run this, the virtual box image will be downloaded and installed. Then,
Vagrant will set up the development environment.

After the development environment is up and running, you can ssh into the box by running
the command:

    vagrant ssh

You should note that all of your repository files are stored at `/vagrant` and they automatically
sync to your repository on your local computer. **Only make git changes locally, and not from the
virtual box!**

## Remote Testing (For Others To Test Your Repo)

We use ngrok to create a tunnel (that bypasses firewalls and port forwarding -- so you don't need to worry
about that). The tunnel will forward the remote port `8080 -> 8080` (for the client), `2772 -> 2772` (for
the server) and `8088 -> 8088` (for server-side debugging).

To start the tunnel, you can run:

    /vagrant/bin/remotetesting
    
This will automatically load the ngrok config located in `/vagrant/bin/ngrok.config`.

Lastly, anyone will be able to access the tunnel from:

    http://armeria.ngrok.com

### Server Management

You can now start up the server. To do so, you have two choices. You can run it in non-daemon mode:

    cd /vagrant/server
    ./app nodaemon

or you can run it in the background:

    cd /vagrant/server
    ./app start

and, if it's running the background, you can stop it with:

    cd /vagrant/server
    ./app stop

## Accessing the Server

Now that the server is running, you can access it from your local machine by going here:

http://local.playarmeria.com:8080/

You don't have to add anything to your HOSTS (or equivalent) file since the DNS entry for
`local.playarmeria.com` points to `127.0.0.1`.

## Adding Changes

Once you've added and committed a few changes, the first thing you want to do is push them to GitHub.
You can do this by running the command:

    git push origin <your branch name>
    
You can then let [Mike Du Russel](https://bitbucket.org/ethryx) know. If everything looks good, we'll go ahead
and pull it into `master`.

When pull requests are merged, Jenkins will automatically shut down the live server, add your changes and start
the server back up. We'll be sure to warn everyone on the game before this takes place.

Furthermore, if the client files are updated (namely index.html and engine.js), the client will warn the user to
refresh the page.

## Server-Side JavaScript Debugging

To debug the node.js server, you first to make sure the node.js debugger is running:

    /vagrant/bin/debug

and then you can run the server so it connects to the debugger:

    node --debug ./app nodaemon

and lastly, you can access this debug session using this url:

    http://local.playarmeria.com:8088/debug?port=5858

OR (if you're using ngrok):

    http://armeria-debug.ngrok.com/debug?port=5858

Let me know if you have any questions.

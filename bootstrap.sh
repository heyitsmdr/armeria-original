#!/usr/bin/env bash

apt-get update
apt-get install -y python-software-properties python g++ make # for nodejs
add-apt-repository -y ppa:chris-lea/node.js                   # for nodejs
apt-get update

# install git
apt-get install -y git

# install / setup nginx
apt-get install -y nginx
cat >/etc/nginx/sites-available/armeria <<EOF
server {
	listen 80;

	server_name local.playarmeria.com;

	root /vagrant/html;
	index index.php index.html index.htm;

	error_page 404 /404.html;
	
    sendfile off;
    
	location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/var/run/php5-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }

    location ~ /\.ht {
    	deny all;
    }
}
EOF
ln -s /etc/nginx/sites-available/armeria /etc/nginx/sites-enabled/armeria

# install / setup php5-fpm
apt-get install -y php5-fpm
sed -i 's/listen = 127.0.0.1:9000/listen = \/var\/run\/php5-fpm.sock/g' /etc/php5/fpm/pool.d/www.conf

# install nodejs and npm
apt-get install -y nodejs
apt-get install -y npm

# install build-essentials (for building npm packages)
apt-get install -y build-essential

# install mongodb (needed for local db)
apt-get install -y mongodb

# install npm packages (windows-safe)
mkdir /tmp/armeria
mv /vagrant/server/package.json /tmp/armeria
cd /tmp/armeria
npm update
npm install --no-bin-links # uses package.json
rm -rf /vagrant/server/node_modules
mv /tmp/armeria/node_modules /vagrant/server
mv /tmp/armeria/package.json /vagrant/server

# create data directory if it doesn't already exist
mkdir /vagrant/server/data
mkdir /vagrant/server/data/scripts

# install curl
apt-get install -y curl

# install grunt-cli
npm install -g grunt-cli

# start server debugger
/vagrant/bin/debug

# restart services
service php5-fpm restart
service nginx restart
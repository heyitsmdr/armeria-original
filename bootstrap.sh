#!/usr/bin/env bash

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

# install npm packages
cd /vagrant/server
npm update
npm install --no-bin-links # uses package.json

# install curl
apt-get install -y curl

# restart services
service php5-fpm restart
service nginx restart
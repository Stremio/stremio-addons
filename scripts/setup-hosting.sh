#!/usr/bin/env bash

NAME=$1
PORT=$2

if [ "$NAME" == "" ] || [ "$PORT" == "" ]; then
	echo "usage: $0 NAME PORT"
	exit 1
fi

echo "Setting up a repo -> /var/repo/$NAME"
mkdir -p /var/{repo,www}/$NAME
( cd /var/repo/$NAME ; git init --bare )
echo -e '#!/bin/sh' "\ngit --work-tree=/var/www/$NAME --git-dir=/var/repo/$NAME checkout -f" "\n( cd /var/www/$NAME ; npm install . )" "\nservice supervisord restart" > /var/repo/$NAME/hooks/post-receive
chmod +x /var/repo/$NAME/hooks/post-receive

echo "Setting up nginx -> /etc/nginx/conf.d/$NAME.conf"
echo -e "server {\n\
    listen       80;\n\
    server_name  ~$NAME;\n\
    access_log  /var/log/nginx/$NAME.log;\n\
    location / {\n\
        proxy_pass http://127.0.0.1:$PORT;\n\
        proxy_read_timeout 15s;\n\
        proxy_connect_timeout 4s;\n\
    }\n\
    location = / { return 301 /stremio/v1; }\n\
}\
" > /etc/nginx/conf.d/$NAME.conf

echo "Setting up supervisord -> /etc/supervisord.d/$NAME.ini"
echo -e "[program:$NAME]\n\
command=npm start\n\
directory=/var/www/$NAME\n\
environment=NODE_ENV=production;PORT=$PORT;STREMIO_LOGGING=1\n\
autorestart=true\n\
" > /etc/supervisord.d/$NAME.ini

#chkconfig nginx on
#chkconfig supervisord on 


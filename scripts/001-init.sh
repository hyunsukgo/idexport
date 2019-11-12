#!/usr/bin/env bash

# I want to make sure that the directory is clean and has nothing left over from
# previous deployments. The servers auto scale so the directory may or may not
# exist.
APP_ROOT=/home/ec2-user/idexport
APP_USER=ec2-user
APP_GROUP=ec2-user
if [ -d $APP_ROOT ]; then
    rm -rf $APP_ROOT
fi
mkdir -vp $APP_ROOT
chown -R $APP_USER:$APP_GROUP $APP_ROOT
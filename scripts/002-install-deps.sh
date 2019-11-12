#!/usr/bin/env bash
APP_ROOT=/home/ec2-user/idexport
cd $APP_ROOT
$(aws ecr get-login --no-include-email --region ap-northeast-2)
docker build -t idexport:latest .
docker tag idexport:latest 533616270150.dkr.ecr.ap-northeast-2.amazonaws.com/idexport:latest
docker push 533616270150.dkr.ecr.ap-northeast-2.amazonaws.com/idexport:latest
npm install

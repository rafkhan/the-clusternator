#!/bin/bash

# fail on error
set -e

LINE_COUNT=0
TARGET_ROW=0
PS_OUTPUT=""
USER="ec2-user"
SSH=""

# validate arguments
if [ -z $1 ]
then
  echo "usage: $0 hostname"
  exit -1
fi

ssh ${USER}@${1} -oStrictHostKeyChecking=no -oUserKnownHostsFile=/dev/null 

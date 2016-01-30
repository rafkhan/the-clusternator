#!/bin/bash
# Please keep exit error numbers unique

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

SSH="ssh ${USER}@${1} -oStrictHostKeyChecking=no -oUserKnownHostsFile=/dev/null " 
LINE_COUNT=`${SSH} docker ps | wc -l`

if [ ${LINE_COUNT} -lt 3 ]
then
  ## NOTE ## consumers *depend* on this being 1
  exit 1
fi

TARGET_ROW=`expr ${LINE_COUNT} - 1`
PS_OUTPUT=`${SSH} docker ps | awk 'NR == '${TARGET_ROW}' {print $1}'`

${SSH} docker logs --follow ${PS_OUTPUT}

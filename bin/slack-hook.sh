#!/bin/bash

# fail on error
set -e

# validate arguments
if [ -z $1 ] || [ -z $2 ] || [ -z $3 ]
then
  echo "usage: $0 message channel URI"
  exit -1
fi

# fail on undefined
set -u

curl -X POST --data-urlencode "payload={\"text\": \"$1\", \"channel\": \"#$2\", \"username\": \"The Clusternator\", \"icon_emoji\": \":the-clusternator:\"}" $3

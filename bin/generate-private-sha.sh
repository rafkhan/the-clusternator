#!/bin/bash

# fail on error
set -e

# validate arguments
if [ -z $1 ]
then
  echo "usage: $0 path/to/.private"
  exit -1
fi

find $1 -type f -exec shasum {} \; | shasum | awk '{print $1}'

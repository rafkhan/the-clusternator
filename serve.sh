#!/bin/bash

# Fail On Error
set -e

# Locate *this* file
echo "Discovering Docker Environment"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# change to this directory
cd $DIR

# decrypt the configuration(s)
echo "Decrypting Configuration"
gpg --out  ./clusternator.tar.gz --passphrase $PASSPHRASE --decrypt \
./clusternator.tar.gz.asc

# extract the configuration tarball
echo "Extracting Configuration Tarball"
tar xfz ./clusternator.tar.gz

# Start the service
echo "Starting Service"
npm start

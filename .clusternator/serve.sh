#!/bin/bash

# Fail On Error
set -e

TARBALL="clusternator.tar.gz"
ENCRYPTED_TARBALL="$TARBALL.asc"

# Locate *this* file
echo "Discovering Docker Environment"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# change to this directory
cd $DIR
cd ..

# mkdir for certs (lets encrypt)
mkdir -p .private/live/${HOST}
touch .private/live/${HOST}/privkey.pem
touch .private/live/${HOST}/fullchain.pem
touch .private/live/${HOST}/chain.pem
touch .private/live/${HOST}/cert.pem

# check if decryption is necessary
if [ -e ./$ENCRYPTED_TARBALL ]; then
  # decrypt the configuration(s)
  echo "Decrypting Configuration"
  gpg --out  ./$TARBALL --passphrase $PASSPHRASE --decrypt ./$ENCRYPTED_TARBALL

  # extract the configuration tarball
  echo "Extracting Configuration Tarball"
  tar xfz ./$TARBALL
fi


# Start the service
echo "Starting Service"
exec npm start

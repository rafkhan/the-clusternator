#!/bin/bash

set -e

TARBALL="clusternator.tar.gz"
ENCRYPTED_TARBALL="${TARBALL}.asc"

# CWD to *script's* directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

# up to project root
cd ..

# check if decryption is necessary
if [ -e ./$ENCRYPTED_TARBALL ]; then
  # decrypt the configuration(s)
  gpg --version
  echo ""
  echo "Decrypting Configuration"
  SHORT="${CLUSTERNATOR_SHARED_KEY:0:5}XXXXXXXXXXXXXXXXXXXX"
  echo "gpg --passphrase ${SHORT} --output ./${TARBALL}\
   --decrypt ./${ENCRYPTED_TARBALL}"
  echo ""
  gpg --passphrase ${CLUSTERNATOR_SHARED_KEY} --output ./${TARBALL}\
   --decrypt ./${ENCRYPTED_TARBALL}

  # extract the configuration tarball
  echo "Extracting Configuration Tarball"
  tar xfz ./${TARBALL}

  # Clean up
  echo "Removing Intermediate File"
  rm ./${TARBALL}
fi

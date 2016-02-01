#!/bin/bash

DEPLOYMENT_PROJECT="the-clusternator-docs"
DEPLOYMENT_REPO="ssh://git@github.com/rangle/${DEPLOYMENT_PROJECT}.git"
TEMP_PATH="/tmp"
TEMP_FILE="/clusternator-docs.tar.gz"
TD="${TEMP_PATH}/${DEPLOYMENT_PROJECT}"
GH_PAGES="gh-pages"

# Fail on error
set -e

# Locate *this* file
echo "Discovering Environment"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# change to this directory
cd $DIR
cd ..

# build the docs
npm run doc
cd ./docs/_site
cp ../../README.md ./
# tar the docs
tar cvfz "${TEMP_PATH}${TEMP_FILE}" ./
cd ../../

# clone the pages repo
cd ${TEMP_PATH}
rm -rf "${TD}"
git clone ${DEPLOYMENT_REPO}
# prune
cd "${TD}"
git checkout ${GH_PAGES}
rm -rf "${TD}/*"

# move in the file
mv ${TEMP_PATH}${TEMP_FILE} "${TD}/"

# extract
cd ${TD}
tar xvfz .${TEMP_FILE}
# clean up
rm "${TD}/${TEMP_FILE}"

# commit
git add .
cd ${TD}
git commit -a

# push
git push origin ${GH_PAGES}

# clean up
cd ${TEMP_PATH}
rm -rf ${TD}

# back to DIR
cd ${DIR}


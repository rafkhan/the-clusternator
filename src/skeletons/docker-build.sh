#!/bin/bash


IMAGE="rafkhan/"${CIRCLE_PROJECT_REPONAME}:pr-${CIRCLE_BUILD_NUM}
export IMAGE

set -e

# CWD to *script's* directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

# up to project root
cd ..

# Remove private folder
rm -rf ./.private

#`aws ecr get-login --registry-ids ${REGISTRY_ID}`
docker login -u ${DOCKER_USER} -p ${DOCKER_PASSWORD} -e ${DOCKER_EMAIL}
docker build -t ${IMAGE} ./
docker push ${IMAGE}

echo "Built ${IMAGE}"

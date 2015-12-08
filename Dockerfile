FROM rafkhan/rangle-node:14.04-4.2.2

# application installs
RUN sudo apt-get update && sudo apt-get -y install git wget \
  && curl -sSL https://get.docker.com/ | sed \
  's/lxc-docker/lxc-docker-${DOCKER_VERSION}/' | sh

RUN mkdir /home/app
COPY . /home/app/
RUN cd /home/app/; npm install


## Expose the ports
EXPOSE 9090


CMD ["/home/app/serve.sh"]

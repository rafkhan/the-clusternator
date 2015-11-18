FROM rafkhan/rangle-node:14.04-4.2.2


# application installs
RUN sudo apt-get update && sudo apt-get -y install git \
  && curl -sSL https://get.docker.com/ | sh

RUN mkdir /opt/clusternator
COPY . /opt/clusternator/
RUN cd /opt/clusternator/; npm install


## Expose the ports
EXPOSE 9090

#CMD ["node", "/opt/clusternator/index.js"]
CMD ["/opt/clusternator/serve.sh"]

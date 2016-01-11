FROM rafkhan/rangle-node:14.04-4.2.3

# application installs
RUN sudo apt-get update
RUN sudo apt-get install -y apt-transport-https
RUN echo deb http://get.docker.com/ubuntu docker main > /etc/apt/sources.list.d/docker.list
RUN apt-key adv --keyserver pgp.mit.edu --recv-keys 36A1D7869245C8950F966E92D8576A8BA88D21E9
RUN sudo apt-get update && sudo apt-get install -y git lxc-docker-1.7.1
ENV PATH /usr/local/bin:$PATH

# setup the application
RUN mkdir /home/app
COPY . /home/app/

# install the application
RUN cd /home/app/; npm install;

## Expose the ports
EXPOSE 9090
EXPOSE 3000

CMD ["/home/app/serve.sh"]

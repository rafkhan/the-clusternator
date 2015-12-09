FROM rafkhan/rangle-node:14.04-4.2.2

# application installs

RUN sudo apt-get update
RUN sudo apt-get install -y apt-transport-https
RUN echo deb http://get.docker.com/ubuntu docker main > /etc/apt/sources.list.d/docker.list
RUN apt-key adv --keyserver pgp.mit.edu --recv-keys 36A1D7869245C8950F966E92D8576A8BA88D21E9
RUN sudo apt-get update
RUN sudo apt-get install -y git lxc-docker-1.9.0

RUN mkdir /home/app
COPY . /home/app/
RUN cd /home/app/; npm install


## Expose the ports
EXPOSE 9090

CMD ["/home/app/serve.sh"]

FROM rafkhan/rangle-node:14.04-4.2.2

RUN mkdir /home/app
COPY . /home/app/
RUN cd /home/app/; npm install


## Expose the ports
EXPOSE 3000

CMD ["/home/app/serve.sh"]

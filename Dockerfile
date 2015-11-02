FROM node:4.2.1-onbuild
RUN mkdir /etc/clusternator
COPY config.local.json /etc/clusternator/
COPY credentials.local.json /etc/clusternator/
EXPOSE 9090

FROM node:6.11
MAINTAINER Adam K Dean

COPY server /server
RUN cd /server && npm i

WORKDIR /server
CMD ["npm", "start"]
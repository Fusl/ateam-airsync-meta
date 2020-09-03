FROM node:alpine
RUN apk upgrade --no-cache \
 && apk add --no-cache bash coreutils \
 && npm install express
COPY index.js /
ENTRYPOINT ["/index.js"]
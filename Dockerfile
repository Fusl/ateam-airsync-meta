FROM node:alpine
RUN apk upgrade --no-cache \
 && apk add --no-cache bash \
 && npm install express
COPY index.js /
ENTRYPOINT ["/index.js"]
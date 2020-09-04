FROM node:alpine
RUN apk upgrade --no-cache \
 && apk add --no-cache bash coreutils
COPY index.js /
ENTRYPOINT ["/index.js"]
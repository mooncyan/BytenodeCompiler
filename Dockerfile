FROM mhart/alpine-node:16
ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./
COPY .npmrc ./
COPY build ./build
RUN yarn install

EXPOSE 3000
CMD ["node", "build/index.js"]
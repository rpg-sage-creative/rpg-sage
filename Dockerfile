FROM node:24
ENV NODE_ENV=development

WORKDIR /rpg-sage/dev
COPY .npmrc .
COPY build ./build
COPY package*.json .
COPY node_modules ./node_modules
RUN npm install

WORKDIR /rpg-sage/dev/config
COPY config/env.docker.json ./env.json

WORKDIR /rpg-sage/dev/node_modules/@rsc-sage
COPY node_modules/@rsc-sage/env/ ./env
COPY node_modules/@rsc-sage/localization/ ./localization
COPY node_modules/@rsc-sage/types/ ./types

WORKDIR /rpg-sage/dev/node_modules/@rsc-utils
COPY node_modules/@rsc-utils/game-utils/ ./game-utils

RUN mkdir -p /rpg-sage/data/sage/bots
RUN mkdir -p /rpg-sage/data/sage/cache
RUN mkdir -p /rpg-sage/data/sage/dice
RUN mkdir -p /rpg-sage/data/sage/e20
RUN mkdir -p /rpg-sage/data/sage/games
RUN mkdir -p /rpg-sage/data/sage/maps
RUN mkdir -p /rpg-sage/data/sage/messages
RUN mkdir -p /rpg-sage/data/sage/pb2e
RUN mkdir -p /rpg-sage/data/sage/servers
RUN mkdir -p /rpg-sage/data/sage/users

CMD ["npm", "run", "start-dev-and-services"]
FROM node:18
ENV NODE_ENV=development

WORKDIR /rpg-sage/dev
COPY build ./build
COPY scripts ./scripts
COPY package*.json .
RUN npm install

WORKDIR /rpg-sage/dev/config
COPY config/env.docker.json ./env.json

WORKDIR /rpg-sage/dev/node_modules/@rsc-sage
COPY node_modules/@rsc-sage/env/ ./env
COPY node_modules/@rsc-sage/types/ ./types

WORKDIR /rpg-sage/dev/node_modules/@rsc-utils
COPY node_modules/@rsc-utils/args-utils/ ./args-utils
COPY node_modules/@rsc-utils/array-utils/ ./array-utils
COPY node_modules/@rsc-utils/cache-utils/ ./cache-utils
COPY node_modules/@rsc-utils/character-utils/ ./character-utils
COPY node_modules/@rsc-utils/class-utils/ ./class-utils
COPY node_modules/@rsc-utils/core-utils/ ./core-utils
COPY node_modules/@rsc-utils/dice-utils/ ./dice-utils
COPY node_modules/@rsc-utils/discord-utils/ ./discord-utils
COPY node_modules/@rsc-utils/io-utils/ ./io-utils
COPY node_modules/@rsc-utils/language-utils/ ./language-utils
COPY node_modules/@rsc-utils/progress-utils/ ./progress-utils
COPY node_modules/@rsc-utils/search-utils/ ./search-utils
COPY node_modules/@rsc-utils/string-utils/ ./string-utils

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

CMD ["npm", "run", "start-mono", "--", "-noBuild"]
FROM navikt/node-express:14-alpine

ENV NODE_ENV=production

COPY server/ server/
COPY static/ static/
COPY package.json package.json
COPY yarn.lock yarn.lock

RUN yarn install --frozen-lockfile

EXPOSE 3000
ENTRYPOINT ["yarn", "start"]

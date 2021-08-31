FROM navikt/node-express:14-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY server/ server/
COPY static/ static/
COPY package.json package.json
COPY yarn.lock yarn.lock
USER root
RUN chown -R apprunner:apprunner /app
USER apprunner
RUN yarn install --frozen-lockfile

EXPOSE 3000
ENTRYPOINT ["yarn", "start"]

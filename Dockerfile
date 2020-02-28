FROM node:12

WORKDIR /app

COPY . /app

RUN yarn install --prod
RUN yarn build

ENV PORT=8000
ENV NODE_ENV=production

EXPOSE $PORT

RUN ls -l

CMD [ "node", "server.js" ]

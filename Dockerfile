FROM node:12

WORKDIR /app

COPY . /app

ENV PORT=8000
ENV NODE_ENV=production

RUN yarn install --prod
RUN yarn build

EXPOSE $PORT

RUN ls -l

CMD [ "node", "server.js" ]

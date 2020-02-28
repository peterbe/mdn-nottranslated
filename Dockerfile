FROM node:12

WORKDIR /app

COPY . /app

RUN yarn install --prod
RUN yarn build

ENV PORT=8000

EXPOSE $PORT

RUN ls -l

CMD [ "node", "server.js" ]

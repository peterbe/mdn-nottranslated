# Actually NOT Translated on MDN?

A tool to help figure out which "translated" documents on MDN are
actually not fully translated.

## Development

First install things:

    yarn install

Then, in one terminal:

    PORT=5000 yarn run server

And, in another terminal:

    PORT=3000 yarn run start

The view:

    open http://localhost:3000


## Docker

Docker is only used for deployment.

To test the docker stuff locally:

    docker build . -t mdn-nottranslated

To run locally:

    docker run -t -i --rm --env-file .env -p 8000:8000 mdn-nottranslated

To view:

    open http://localhost:8000


To actually **deploy** to Heroku, it should be enough to just:

    git push heroku master

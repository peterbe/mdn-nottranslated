# Actually NOT Translated on MDN?

A tool to help figure out which "translated" documents on MDN are
actually not fully translated.

## Development

First install things:

    yarn install

Then run:

    yarn start

The view:

    open http://localhost:8000


## Docker

Docker is only used for deployment. To build:

    docker build . -t mdn-nottranslated

To run locally:

    docker run -t -i --rm --env-file .env -p 8000:8000 mdn-nottranslated

To view:

    open http://localhost:8000

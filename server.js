const path = require("path");
const url = require("url");

const express = require("express");
const Sentry = require("@sentry/node");
const cheerio = require("cheerio");
const fetch = require("node-fetch");

const app = express();

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });

  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
  // The error handler must be before any other error middleware
  app.use(Sentry.Handlers.errorHandler());
}

const STATIC_ROOT = path.join(__dirname, "build");
app.use(
  express.static(STATIC_ROOT, {
    // https://expressjs.com/en/4x/api.html#express.static
  })
);

const PORT = JSON.parse(process.env.PORT || "5000");
const HOST = "0.0.0.0";
const baseUrl =
  process.env.MDN_BASE_URL || "https://wiki.developer.mozilla.org";

function download(uri) {
  let u = baseUrl + uri;
  let parsed = url.parse(u);
  if (parsed.pathname !== uri) {
    throw new Error("getting too nervous about the uri");
  }
  console.log("FETCH HTML:", u, encodeURI(u));
  return fetch(encodeURI(u)).then(r => {
    if (!r.ok) {
      console.log("THROW:", r.status);
      throw new Error(r.status);
    }
    return r.text();
  });
}

function downloadMetadata(locale, slug) {
  let uri = `/api/v1/doc/${locale}/${slug}`;
  let u = baseUrl + uri;
  let parsed = url.parse(u);

  console.log("FETCH METADATA:", u, encodeURI(u));
  return fetch(encodeURI(u)).then(r => {
    if (!r.ok) {
      console.log("THROW:", r.status);
      throw new Error(r.status);
    }
    return r.json();
  });
}

app.get("/api/v0/about", (req, res) => {
  let { slug, locale } = req.query;
  if (!slug) {
    return res.status(400).send("no ?slug=...");
  }
  if (!locale) {
    return res.status(400).send("no ?locale=...");
  }
  downloadMetadata(locale, slug)
    .then(data => {
      res.json(data);
    })
    .catch(ex => {
      console.error("Failed to fetch or download", ex.toString());
      if (ex.toString().includes("404")) {
        res.status(404).send(`Page not found ${locale}/${slug}`);
      } else {
        res.status(500).send(ex.toString());
      }
    });
});

app.get("/api/v0/preview", (req, res) => {
  let { uri } = req.query;
  if (!uri) {
    return res.status(400).send("no ?uri=...");
  }
  download(uri)
    .then(rawHtml => {
      let $ = cheerio.load(rawHtml);
      $(
        "script, div.sidebar, div.global-notice, header, footer, meta"
      ).remove();
      $(
        'link[rel="alternative"],section.newsletter-container, ' +
          "main .full-width-row-container, div.metadata, " +
          "aside.document-toc-container,div.mdn-wiki-notice"
      ).remove();
      $('link[rel="stylesheet"]').each((i, el) => {
        el.attribs["href"] = baseUrl + el.attribs["href"];
      });
      $("img[src]").each((i, el) => {
        if (el.attribs["src"].startsWith("/")) {
          el.attribs["src"] = baseUrl + el.attribs["src"];
        } else {
          console.log("SRC!!:", el.attribs["src"]);
        }
      });
      res.send($.html().trim());
    })
    .catch(ex => {
      console.error("Failed to fetch or download", ex.toString());
      if (ex.toString().includes("404")) {
        res.status(404).send(`Page not found ${uri}`);
      } else {
        res.status(500).send(ex.toString());
      }
    });
});

// Catchall
app.get("/*", (req, res) => {
  if (req.url.startsWith("/static")) {
    res.status(404).send("Page not found");
  } else {
    res.sendFile(path.join(STATIC_ROOT, "/index.html"));
  }
});
// app.get("/", (req, res) => res.send("Hello World!"));

app.listen(PORT, HOST, () =>
  console.log(`MDN nottranslated started on :${PORT}`)
);

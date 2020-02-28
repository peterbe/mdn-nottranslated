const path = require("path");
const url = require("url");

const express = require("express");
const cheerio = require("cheerio");
const fetch = require("node-fetch");

const app = express();

const STATIC_ROOT = path.join(__dirname, "build");
app.use(
  express.static(STATIC_ROOT, {
    // https://expressjs.com/en/4x/api.html#express.static
  })
);

const PORT = JSON.parse(process.env.PORT || "5000");
const HOST = "0.0.0.0";
const baseUrl = process.env.MDN_BASE_URL || "https://developer.mozilla.org";

function download(uri) {
  let u = baseUrl + uri;
  let parsed = url.parse(u);
  if (parsed.pathname !== uri) {
    throw new Error("getting too nervous about the uri");
  }
  console.log("FETCH:", u, encodeURI(u));
  return fetch(encodeURI(u)).then(r => {
    if (!r.ok) {
      throw new Error(`${u}: ${r.statusCode}`);
    }
    return r.text();
  });
}

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
          "aside.document-toc-container"
      ).remove();
      $('link[rel="stylesheet"]').each((i, el) => {
        el.attribs["href"] = baseUrl + el.attribs["href"];
      });
      $("img[src]").each((i, el) => {
        console.log("SRC!!:", el.attribs["src"]);
        // el.attribs["href"] = baseUrl + el.attribs["href"];
      });
      res.send($.html().trim());
    })
    .catch(ex => {
      res.status(500).send(ex.toString());
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

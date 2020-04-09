#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const _LANGUAGES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "languages.json"))
);
const LANGUAGES = {};
Object.entries(_LANGUAGES).forEach(([key, value]) => {
  LANGUAGES[key.toLowerCase()] = value;
});
const root = process.argv[2];
const files = fs.readdirSync(root);

files.sort((a, b) => (Math.random() > 0.5 ? -1 : 1));

files
  .filter((file) => {
    // return file.includes("sv");
    return (
      file.endsWith(".json") &&
      !["summary.json", "inception.json"].includes(file)
    );
  })
  .slice(0, 3)
  .forEach((file) => {
    // const code = file.replace(".json", "").toLowerCase();

    // const language = LANGUAGES[code];
    // if (!language) {
    //   throw new Error(code);
    // }
    let suspectFile = path.join(root, file);
    originalContent = JSON.parse(fs.readFileSync(suspectFile));
    const content = originalContent.filter((x) => x.leaf && !x.notFound);
    content.sort((a, b) => (Math.random() > 0.5 ? -1 : 1));

    let checked = {};
    let checksDone = 0;
    function checkNext() {
      if (checksDone >= 10 || checksDone >= content.length) {
        console.log("Let's stop there for", file);
        let newOriginalContent = originalContent.map((suspect) => {
          if (suspect.slug in checked) {
            suspect.notFound = checked[suspect.slug];
          }
          return suspect;
        });
        fs.writeFileSync(
          suspectFile,
          JSON.stringify(newOriginalContent, null, 2)
        );
        return;
      }
      let suspect = content[checksDone];

      let wikiUrl = `https://wiki.developer.mozilla.org/${suspect.locale}/docs/${suspect.slug}`;
      console.log("Checking", wikiUrl);
      fetch(encodeURI(wikiUrl), { method: "HEAD" }).then((response) => {
        if (!response.ok) {
          if (response.status === 404) {
            console.log("IT HAS ALREADY BEEN DELETED!!", wikiUrl);
            // REWRITE THE JSON!
            checked[suspect.slug] = true;
            // fs.writeFileSync(suspectFile, JSON.stringify(content, null, 2));
          }
        } else {
          console.log("Still there...", wikiUrl);
          checked[suspect.slug] = false;
        }
        checksDone++;
        checkNext();
      });
    }
    checkNext();
    // content.slice(0, 10).forEach(async suspect => {
    //   let wikiUrl = `https://wiki.developer.mozilla.org/${suspect.locale}/docs/${suspect.slug}`;
    //   //   console.log("Checking", wikiUrl);
    //   let response = await fetch(encodeURI(wikiUrl), { method: "HEAD" });
    //   if (!response.ok) {
    //     if (response.status === 404) {
    //       console.log("IT HAS ALREADY BEEN DELETED!!", wikiUrl);
    //     }
    //   } else {
    //     console.log("Still there...", wikiUrl);
    //   }
    // });
  });

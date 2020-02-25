#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const _LANGUAGES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "languages.json"))
);
const LANGUAGES = {};
Object.entries(_LANGUAGES).forEach(([key, value]) => {
  LANGUAGES[key.toLowerCase()] = value;
});
const root = process.argv[2];
const files = fs.readdirSync(root);

const all = [];
for (const file of files) {
  if (file.endsWith(".json") && file !== "summary.json") {
    const code = file.replace(".json", "");
    const language = LANGUAGES[code];
    if (!language) {
      throw new Error(code);
    }
    const content = fs.readFileSync(path.join(root, file));
    const count = JSON.parse(content).length;
    all.push({
      code,
      language,
      count,
      file
    });
  }
}

all.sort((a, b) => {
  if (b.language.English.toLowerCase() > a.language.English.toLowerCase()) {
    return -1;
  } else if (
    b.language.English.toLowerCase() < a.language.English.toLowerCase()
  ) {
    return 1;
  } else {
    return 0;
  }
});

const destination = path.join(root, "summary.json");
fs.writeFileSync(destination, JSON.stringify(all, null, 2));
console.log(`Wrote ${destination}`);

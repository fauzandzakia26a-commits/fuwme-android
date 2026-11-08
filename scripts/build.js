"use strict";

const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const source = path.join(projectRoot, "public_html");
const output = path.join(projectRoot, "dist");

if (!fs.existsSync(path.join(source, "index.html"))) {
  throw new Error("Build failed: public_html/index.html was not found.");
}

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, { recursive: true });
if (!fs.existsSync(path.join(output, "index.html"))) {
  throw new Error("Build failed: dist/index.html was not generated.");
}
console.log(`Built FUWME into ${path.relative(projectRoot, output)}.`);

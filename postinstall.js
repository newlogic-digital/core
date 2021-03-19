import fs from "fs";

const cwd = process.cwd();

if (!fs.existsSync(cwd + "/gulpfile.js")) {
    fs.copyFileSync("gulpfile.js", cwd + "/gulpfile.js")
}
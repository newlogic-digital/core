import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();

if (!fs.existsSync(cwd + "/gulpfile.js")) {
    fs.copyFileSync(__dirname + "/gulpfile.js", cwd + "/gulpfile.js")
}
// Generates study.jas from study-config.json with fresh UUIDs.
// Run once when creating a new study from the template: npm run init-study
//
// IMPORTANT: Never run this again after importing to JATOS.
// Regenerating UUIDs causes JATOS to treat re-imports as a new study
// instead of updating the existing one, resulting in duplicates.
//
// Use --force to overwrite an existing study.jas (e.g. before first JATOS import).

// Built-in Node.js modules — no npm install needed.
// crypto: generates cryptographically random UUIDs
// fs: read/write files on disk
// path: safely construct file paths (handles OS differences like / vs \)
// url: converts this script's URL (import.meta.url) to a plain file path
import { randomUUID } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ES modules don't have __dirname built in, so we reconstruct it:
// import.meta.url = the URL of this script file (e.g. file:///…/scripts/init-study.js)
// fileURLToPath: converts that URL to a plain path (…/scripts/init-study.js)
// dirname: strips the filename, leaving just the directory (…/scripts/)
// resolve(__dirname, ".."): go one level up → the project root
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Compute absolute paths to the files we'll read/write.
// resolve() just joins path segments into a full absolute path — nothing is read yet.
const jasPath = resolve(root, "study.jas");
const configPath = resolve(root, "study-config.json");

// Check if --force was passed: e.g. `npm run init-study -- --force`
// process.argv is a built-in array of all CLI arguments passed to this script.
const force = process.argv.includes("--force");

// Safety guard: refuse to overwrite an existing study.jas unless --force is set.
// After a JATOS import, the UUIDs in study.jas are permanent database keys —
// regenerating them would make JATOS treat re-imports as a new study.
if (existsSync(jasPath) && !force) {
  console.error(
    "study.jas already exists. Run with --force to overwrite.\n" +
    "WARNING: overwriting after a JATOS import will cause duplicate studies on re-import."
  );
  process.exit(1);
}

// Read study-config.json and parse it from a JSON string into a JS object.
const config = JSON.parse(readFileSync(configPath, "utf8"));

// Build the study.jas object. This is the JATOS study metadata format.
// Each uuid() call generates a fresh random ID — permanent once imported into JATOS.
const jas = {
  version: "3",
  data: {
    uuid: randomUUID(),           // unique ID for the study itself
    title: config.title,
    description: config.description ?? "",
    groupStudy: false,
    linearStudy: false,
    allowPreview: false,
    dirName: config.dirName,      // folder name inside the .jzip archive
    comments: "",
    jsonData: null,
    endRedirectUrl: "",
    studyEntryMsg: null,
    // Three components = three pages run in sequence by JATOS
    componentList: [
      {
        uuid: randomUUID(),
        title: "Consent",
        htmlFilePath: "consent.html",
        reloadable: true,
        active: true,
        comments: "",
        jsonData: null,
      },
      {
        uuid: randomUUID(),
        title: "Experiment",
        htmlFilePath: "experiment.html",
        reloadable: false,
        active: true,
        comments: "",
        jsonData: null,
      },
      {
        uuid: randomUUID(),
        title: "Debrief",
        htmlFilePath: "debrief.html",
        reloadable: true,
        active: true,
        comments: "",
        jsonData: null,
      },
    ],
    // Two batches: Main (real participants) and Test (researcher use).
    batchList: [
      {
        uuid: randomUUID(),
        title: "Main",
        active: true,
        maxActiveMembers: null,
        maxTotalMembers: null,
        maxTotalWorkers: null, 
        allowedWorkerTypes: ["GeneralMultiple"],
        comments: "Main data collection batch.",
        jsonData: null,
      },
      {
        uuid: randomUUID(),
        title: "Test",
        active: true,
        maxActiveMembers: null,
        maxTotalMembers: null,
        maxTotalWorkers: null,
        allowedWorkerTypes: ["GeneralMultiple"],
        comments: "Testing batch — researcher use only.",
        jsonData: null,
      },
    ],
  },
};

// Serialize to pretty-printed JSON and write to disk.
writeFileSync(jasPath, JSON.stringify(jas, null, 2) + "\n");
console.log(`study.jas generated for "${config.title}" (dirName: ${config.dirName})`);

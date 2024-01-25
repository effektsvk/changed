#!/usr/bin/env bun

import _debug from "debug";
import meow from "meow";
import { Repo } from "@/model/Repo";
import { db } from "@/api/db";
import { RepoModel } from "@/model/RepoModel";
import { marked } from "marked";
// import {markedEmoji} from "marked-emoji";
import chalk from "chalk";

const debug = _debug("app:main");

const cli = meow(
  `
  Usage
    chgd <package_name>

  Options
    --force, -f  Force update

  Examples
    chgd @txo/functional
`,
  {
    importMeta: import.meta,
    flags: {
      force: {
        type: "boolean",
        shortFlag: "f",
      },
    },
  },
);

const repoModel = new RepoModel(db);
const [packageName] = cli.input;
const force = cli.flags.force || false;
if (packageName === undefined) {
  cli.showHelp();
}
debug(`Package name: ${packageName}`);
if (force) debug("Forcing update...");
const repo = await Repo.fromCdn(packageName, repoModel, force);

// TODO: add option to not write if there are no changes
// TODO: overwrite existing repo when forcing update
repoModel.upsertRepo(repo);

const renderer = new marked.Renderer();

renderer.heading = (text, level) => {
  if (level === 1) {
    return "\n" + chalk.bold.underline(text) + "\n\n";
  } else if (level === 2) {
    return "\n" + chalk.bold(text) + "\n\n";
  } else {
    return chalk.italic(text) + "\n\n";
  }
};

// Customize list item rendering
renderer.listitem = (text) => {
  return chalk.green(" • ") + text + "\n";
};

// Customize code rendering (e.g., for commit hashes)
const codeRenderer = (code: string) => {
  return chalk.yellow(code);
};
renderer.code = codeRenderer;
renderer.codespan = codeRenderer;

// Customize link rendering
renderer.link = (_href, _title, text) => {
  return chalk.blue.underline(text);
};

renderer.strong = (text) => {
  // TOOD: figure out how to handle lines with newlines
  return chalk.bold(text);
};

renderer.list = (body, _ordered) => {
  return body;
};

renderer.em = (text) => {
  return chalk.italic(text);
};

renderer.paragraph = (text) => {
  return text;
};

// TODO: add support for "feat", "fix", "chore" and so on

marked.setOptions({
  renderer,
});
// marked.use(markedEmoji);

console.log(marked(repo.changelogText));

db.close();

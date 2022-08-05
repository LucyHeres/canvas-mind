const child_process = require("child_process");
const minimist = require("minimist");
const execa = require("execa");
const fs = require("fs");
const path = require("path");

const args = minimist(process.argv.slice(2));
const issueIds = args["issue"]?args["issue"].split(","):[];

const writeChangeLog = () => {
  const changelogPath = path.resolve(__dirname, "CHANGELOG.md");
  let data = fs.readFileSync(changelogPath, "utf8");
  const i = data.indexOf("\n");
  data = spliceStr(data, i, `\n\n### Issues\n` + issueIds.map(issueId=>`[#${issueId}](https://github.com/LucyHeres/canvas-mind/issues/${issueId})`).join(","));
  fs.writeFileSync(changelogPath, data, "utf8");
};

const spliceStr = (str, index, newStr) => {
  return str.slice(0, index) + newStr + str.slice(index);
};

const main = () => {
  await execa("npm", ["version", "patch"], { stdio: "inherit" });
  await execa("npm", ["run", "changelog"], { stdio: "inherit" });
  writeChangeLog();
  await execa("git", ["add", "CHANGELOG.md"], { stdio: "inherit" });
  await execa("git", ["commit", "-m", `Update to %s`], { stdio: "inherit" });
  await execa("git", ["push", "--follow-tags"], { stdio: "inherit" });
}

main();
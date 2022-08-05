const child_process = require("child_process");
const minimist = require("minimist");
const execa = require("execa");
const semver = require("semver");
const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const chalk = require('chalk')

const step = (msg) => console.log(chalk.cyan(msg));

const curVersion = require("./package.json").version;
const bumps = ["patch", "minor", "major", "prepatch"];
const versions = {};
bumps.forEach((b) => {
  versions[b] = semver.inc(curVersion, b);
});
const bumpChoices = bumps.map((b) => ({ name: `${b} (${versions[b]})`, value: b }));

const writeChangeLog = () => {
  const changelogPath = path.resolve(__dirname, "CHANGELOG.md");
  let data = fs.readFileSync(changelogPath, "utf8");
  const i = data.indexOf("\n");
  data = spliceStr(data, i, `\n\n### Issues\n` + issueIds.map((issueId) => `[#${issueId}](https://github.com/LucyHeres/canvas-mind/issues/${issueId})`).join(","));
  fs.writeFileSync(changelogPath, data, "utf8");
};

const spliceStr = (str, index, newStr) => {
  return str.slice(0, index) + newStr + str.slice(index);
};

const main = async () => {
  step(`Current version: ${curVersion}`);

  const { bump, customVersion } = await inquirer.prompt([{
    name: "bump",
    message: "请选择要发行的版本：",
    type: "list",
    choices: [...bumpChoices],
  }]);

  const version = customVersion || versions[bump];

  const { yes } = await inquirer.prompt([{
    name: "yes",
    message: `确定要发行的版本号是 ${version} 吗?`,
    type: "confirm",
  }]);

  const { issues } = await inquirer.prompt([{
    name: "issues",
    message: `请输入需要关联的issue(多个用逗号分隔)：`,
    type: "input",
  }]);

  const issueIds = issues ? issues.split(",") : [];

  if (yes) {
    try {
      await execa("npm", ["version", version], { stdio: "inherit" });
      await execa("npm", ["run", "changelog"], { stdio: "inherit" });
      writeChangeLog();
      await execa("git", ["add", "CHANGELOG.md"], { stdio: "inherit" });
      await execa("git", ["commit", "-m", `Update to %s`], { stdio: "inherit" });
      await execa("git", ["push", "--follow-tags"], { stdio: "inherit" });
    } catch (e) {
      //
    }
  }
};

main().catch(err => {
  console.error(err)
  process.exit(1)
})


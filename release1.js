const child_process = require("child_process");
const minimist = require("minimist");
const execa = require("execa");
const fs = require("fs");
const path = require("path");

const args = minimist(process.argv.slice(2));
const issueIds = args["issue"]?args["issue"].split(","):[];

let commitMessage = "";
if (issueIds.length>0) {
  commitMessage = `Update to %s , closes ` + issueIds.map(issueId=>`#${issueId}`).join(",");
} else {
  commitMessage = `Update to %s`;
}
console.log(commitMessage);
const writeChangeLog = () => {
  const changelogPath = path.resolve(__dirname, "CHANGELOG.md");
  let data = fs.readFileSync(changelogPath, "utf8");
  const i = data.indexOf("\n");
  data = spliceStr(data, i, `\n\n### 关联issue ` + issueIds.map(issueId=>`[#${issueId}](https://github.com/LucyHeres/canvas-mind/issues/${issueId})`).join(","));
  fs.writeFileSync(changelogPath, data, "utf8");
};

const spliceStr = (str, index, newStr) => {
  return str.slice(0, index) + newStr + str.slice(index);
};

(async () => {
  await execa("npm", ["version", "patch"], { stdio: "inherit" });
  await execa("npm", ["run", "changelog"], { stdio: "inherit" });
  writeChangeLog();
  await execa("git", ["add", "CHANGELOG.md"], { stdio: "inherit" });
  await execa("git", ["commit", "-m", commitMessage], { stdio: "inherit" });
  await execa("git", ["push", "--follow-tags"], { stdio: "inherit" });
})();

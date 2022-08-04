const child_process = require("child_process");
const minimist = require("minimist");
const execa = require("execa");
const fs = require("fs");

const args = minimist(process.argv.slice(2));
const issue = args["issue"];

let commitMessage = "";
if (issue !== undefined) {
  commitMessage = "Update to %s , closes #" + issue;
} else {
  commitMessage = "Update to %s";
}

const writeChangeLog = () => {
  fs.readFile("CHANGELOG.md", "utf8", function (err, data) {
    console.log(data);
  });
};

(async () => {
  await execa("npm", ["version", "patch"], { stdio: "inherit" });
  await execa("npm", ["run", "changelog"], { stdio: "inherit" });
  writeChangeLog()
  await execa("git", ["add", "CHANGELOG.md"], { stdio: "inherit" });
  await execa("git", ["commit", "-m", commitMessage], { stdio: "inherit" });
  await execa("git", ["push", "--follow-tags"], { stdio: "inherit" });
})();

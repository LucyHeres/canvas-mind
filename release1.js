const child_process = require("child_process");
const minimist = require("minimist");
const execa = require("execa");
const args = minimist(process.argv.slice(2));
const issue = args["issue"];

const commitMessage = "";
if(issue !==undefined) {
  commitMessage = "Update to %s , closes #" + issue
}else{
  commitMessage = "Update to %s";
}

(async () => {
  await execa("npm", ["version", "patch", "-m", ""+commitMessage], { stdio: "inherit" });
  await execa("git", ["push", "--follow-tags"], { stdio: "inherit" });
})();

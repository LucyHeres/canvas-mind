const child_process = require("child_process");
const minimist = require("minimist");
const execa = require("execa");
const args = minimist(process.argv.slice(2));
const issue = args["issue"];

let commitMessage = "";
if(issue !== undefined) {
  commitMessage = "Update to %s , closes #" + issue
}else{
  commitMessage = "Update to %s";
}
// , "-m", ""+commitMessage

(async () => {
  await execa("npm", ["version", "patch"], { stdio: "inherit" });
  await execa("npm", ["run", "changelog"], { stdio: "inherit" });
  await execa("git", ["push", "--follow-tags"], { stdio: "inherit" });
})();

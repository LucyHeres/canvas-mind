const child_process = require("child_process");
const minimist = require('minimist');
const execa = require("execa");
const args = minimist(process.argv.slice(2))
const issue = args['issue'];

// const cmd ='npm version patch -m "closes #'+issue +'" && git push && git push --tags'

(async () => {
  await execa("npm", ["version", "patch","-m","\"Update to %s , closes #"+issue+"\""]);
  const { stdout } = await execa("git", ["push", "--follow", "-tags"]);
  console.log(stdout);
})();

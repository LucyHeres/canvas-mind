const execa = require("execa");
const semverValid = require("semver").valid;
const regex = /tag:\s*(.+?)[,)]/;

const main = async (req, res, next) => {
  try {
    const { stdout } = await execa("git", ["log", "--decorate", "--no-color"], { maxBuffer: Infinity });
    const tags = stdout.match(regex)
    const str = stdout.slice(0,tags.index)
    const issues = str.match(/\nCloses \#\d+\n/ig);
    console.log(issues);
  } catch (e) {
    console.error(e);
  }
};

main();

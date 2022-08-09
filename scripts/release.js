const minimist = require("minimist");
const execa = require("execa");
const semver = require("semver");
const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const regex = /tag:\s*(.+?)[,)]/;
const step = (msg) => console.log(chalk.cyan(msg));

// 获取参数中的版本类型
const argv = minimist(process.argv.slice(2));
const bump = argv["version"] || "patch";

// 获取package.json中的version
const packageJsonData = require("../package.json");
const getPackageVersion = () => packageJsonData.version;

// 生成目标版本号
const curVersion = getPackageVersion();
const targetVersion = semver.inc(curVersion, bump);

// 修改package.json中的version
const writePackageVersion = (newVersion) => {
  packageJsonData.version = newVersion;
  const pkgPath = path.resolve(__dirname, "../package.json");
  fs.writeFileSync(pkgPath, JSON.stringify(packageJsonData, null, 2));
};

const spliceStr = (str, index, newStr) => {
  return str.slice(0, index) + newStr + str.slice(index);
};

// 在changelog中写入issue相关内容
const writeIssueToChangeLog = (issueIds,version) => {
  const changelogPath = path.resolve(__dirname, "../CHANGELOG.md");
  let data = fs.readFileSync(changelogPath, "utf8");
  const i = data.indexOf("\n");
  if (!data.slice(0, i).includes(`[${version}]`)) {
    return;
  }
  data = spliceStr(data, i, `\n\n### Issues\n` + issueIds.map((issueId) => `[#${issueId}](https://github.com/LucyHeres/canvas-mind/issues/${issueId})`).join(","));
  fs.writeFileSync(changelogPath, data, "utf8");
};

// 从git log中获取issues
const getIssueIds = async () => {
  try {
    const { stdout } = await execa("git", ["log", "--decorate", "--no-color"], { maxBuffer: Infinity });
    const tags = stdout.match(regex);
    const str = stdout.slice(0, tags.index);
    console.log(44444,str);
    const issues = str.match(/\s+Closes #\d+/gi) || [];
    const issueIds = issues.map((issue) => issue.replace(/[^\d]/gi, ""));
    console.log(111111,issues,issueIds);
    return issueIds;
  } catch (e) {
    console.error(e);
    return [];
  }
};

const main = async () => {
  step(`Current version: ${curVersion} , Target version: ${targetVersion}`);

  try {
    step("\nUpdating package version...");
    writePackageVersion(targetVersion);

    step("\nGenerating changelog...");
    await execa("npm", ["run", "changelog"], { stdio: "inherit" });
    const issueIds = await getIssueIds();
    console.log(12,issueIds);
    if (issueIds && issueIds.length > 0) {
      writeIssueToChangeLog(issueIds,targetVersion);
    }
    await execa("git", ["add", "-A"], { stdio: "inherit" });
    await execa("git", ["commit", "-m", `chore: update to v${targetVersion}`], { stdio: "inherit" });

    step("\nPushing ...");
    await execa("git", ["tag", "v" + targetVersion], { stdio: "inherit" });
    await execa("git", ["push"], { stdio: "inherit" });
    await execa("git", ["push", "--tags"], { stdio: "inherit" });

    step("\nSuccess 版本发布成功!");
  } catch (e) {
    step("\noh no 版本发布失败了！");
    console.error(e);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

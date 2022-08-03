
const minimist = require('minimist');
const args = minimist(process.argv.slice(2))
const issue = args['issue'];
const exec = require("child_process").exec;

const genVersion = ()=>{
  const cmd ='npm version patch -m "#'+issue +'"'
  exec(cmd, (error, stdout, stderr) => {
    if (!error) {
      console.log(123)
    } else {
      console.log(456)
    }
  });
}

genVersion()
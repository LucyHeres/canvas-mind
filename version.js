
const minimist = require('minimist');
const args = minimist(process.argv.slice(2))
const issue = args['issue'];
console.log(issue)

const genVersion = ()=>{
  process.exec('npm version patch -m '+"Upgrade to %s #"+issue+' && git push --follow-tags', (error, stdout, stderr) => {
    if (!error) {
      console.log(123)
    } else {
      console.log(456)
    }
  });
}
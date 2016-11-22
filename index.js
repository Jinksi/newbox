const inquirer = require('inquirer')
const spawn = require('cross-spawn')
const chalk = require('chalk')
const replace = require('replace-in-file')

const questions = [
  {
    type: 'input',
    name: 'dirname',
    message: 'Site Directory Name',
    validate: input => input.length > 1
  },
  {
    type: 'input',
    name: 'wpuser',
    message: 'Wordpress Username',
    validate: input => input.length > 1
  },
  {
    type: 'input',
    name: 'wppassword',
    message: 'Wordpress Password',
    validate: input => input.length > 1
  },
  {
    type: 'input',
    name: 'wpemail',
    message: 'Wordpress Email',
    validate: input => input.length > 1
  },
  {
    type: 'input',
    name: 'wptitle',
    message: 'Site Title',
    validate: input => input.length > 1
  },
  {
    type: 'confirm',
    name: 'happy',
    message: 'Happy?'
  },
]

inquirer.prompt(questions).then(function (answers) {
  if(!answers.happy) process.exit(0)
  const config = {
    dirname: answers.dirname,
    wpuser: answers.wpuser,
    wppassword: answers.wppassword,
    wpemail: answers.wpemail,
    wptitle: answers.wptitle,
    wpurl: answers.dirname,
    wprename: answers.dirname,
  }

  // Clone thrive-box
  console.log(chalk.bgCyan('🍉 Cloning thrive-box...'))
  spawn.sync('git', ['clone', 'https://github.com/Jinksi/thrive-box.git', config.dirname], { stdio: 'inherit' })

  // Update Vagrantfile
  console.log(chalk.bgCyan('Writing Hostname to Vagrantfile...'))
  const options = {
    files: `${config.dirname}/Vagrantfile`,
    replace: 'thrive-box.dev',
    with: `${config.dirname}.dev`
  }
  try {
    let changedFiles = replace.sync(options)
    console.log(chalk.cyan('Updated files:', changedFiles.join(', ')))
  }
  catch (error) {
    console.error(chalk.bgRed('Error occurred:', error))
  }

  // Update config.yml
  console.log(chalk.bgCyan('Updating config.yml...'))
  const configFile = `${config.dirname}/config.yml`
  const configOptions = [
    { name: 'user', default: 'admin'},
    { name: 'password', default: 'password'},
    { name: 'email', default: 'info@thriveweb.com.au'},
    { name: 'url', default: 'thrive-box.dev'},
    { name: 'title', default: 'Thrive Box'},
    { name: 'rename', default: '"thrive-box"'},
  ]
  configOptions.map(option => {
    const name = option.name
    const original = option.default
    if(config[`wp${name}`]){

      try {
        let changedFiles = replace.sync({
          files: configFile,
          replace: `${name}: ${original}`,
          with: `${name}: ${config[`wp${name}`]}`
        })
        console.log(chalk.cyan('Updated file:', changedFiles.join(', ')))
      }
      catch (error) {
        console.error(chalk.bgRed('Error occurred:', error))
      }

    } else {
      console.log(chalk.bgRed(`No argument passed for ${name}`))
    }

  })

  // Vagrant Up
  console.log(chalk.bgCyan(`Booting ${config.dirname} box...`))
  process.chdir(config.dirname)
  spawn.sync('vagrant', ['up'], { stdio: 'inherit' })

  // Run Setup!
  console.log(chalk.bgCyan(`Setting Up Wordpress...`))
  spawn.sync('vagrant', ['ssh', '-c', 'cd /var/www && bash setup.sh'], { stdio: 'inherit' })

  console.log(chalk.bgCyan('Done'))
})

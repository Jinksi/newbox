#!/usr/bin/env node

const inquirer = require('inquirer')
const spawn = require('cross-spawn')
const chalk = require('chalk')
const replace = require('replace-in-file')

const plugins = [
  { name: 'WooCommerce', value: 'woocommerce'},
  { name: 'ACF', value: 'https://github.com/wp-premium/advanced-custom-fields-pro/archive/master.zip'},
  { name: 'Gravity Forms', value: 'https://github.com/wp-premium/gravityforms/archive/master.zip'},
  { name: 'Wordpress SEO', value: 'wordpress-seo'},
  { name: 'Wordpress SEO ACF Analysis', value: 'yoast-seo-acf-analysis'},
  { name: 'iThemes Security', value: 'better-wp-security'},
  { name: 'Updraft Plus', value: 'updraftplus'},
  { name: 'WP-Sync-DB', value: 'https://github.com/wp-sync-db/wp-sync-db/archive/master.zip'},
  { name: 'WP-Sync-DB Media', value: 'https://github.com/wp-sync-db/wp-sync-db-media-files/archive/master.zip'},
  { name: 'Intuitive CPO', value: 'intuitive-custom-post-order'},
  { name: 'SVG Support', value: 'svg-support'},
  { name: 'Disable WordPress updates', value: 'disable-wordpress-updates'},
  { name: 'Password Protected', value: 'password-protected'},
  { name: 'Wp Instagram Widget', value: 'wp-instagram-widget'},
  { name: 'Simply Show Hooks', value: 'simply-show-hooks'},
  { name: 'Tree Page View', value: 'cms-tree-page-view'},
  { name: 'NS Featured Posts', value: 'ns-featured-posts'},
  { name: 'Regenerate Thumbnails', value: 'regenerate-thumbnails'},
]

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
    type: 'checkbox',
    name: 'plugins',
    message: 'Plugins',
    default: plugins.map(plugin => plugin.value),
    choices: plugins,
  },
  {
    type: 'confirm',
    name: 'theme',
    message: 'Install Flex With Benefits?'
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
    wpplugins: answers.plugins,
    wptheme: answers.theme,
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
      }
      catch (error) {
        console.error(chalk.bgRed('Error occurred:', error))
      }

    } else {
      console.log(chalk.bgRed(`No argument passed for ${name}`))
    }

  })

  if(answers.plugins.length){
    try {
      const pluginsStr = answers.plugins.map(plugin => {
        return `  - ${plugin}`
      })
      let changedFiles = replace.sync({
        files: configFile,
        replace: `plugins_inactive:`,
        with: `plugins_inactive: \n${pluginsStr.join('\n')}`
      })
      console.log(chalk.cyan('Updated file:', changedFiles.join(', ')))
    }
    catch (error) {
      console.error(chalk.bgRed('Error occurred:', error))
    }
  }


  if(!answers.theme){
    try {
      let changedFiles = replace.sync({
        files: configFile,
        replace: `theme: true`,
        with: `theme: false`
      })
    }
    catch (error) {
      console.error(chalk.bgRed('Error occurred:', error))
    }
  }

  // Vagrant Up
  console.log(chalk.bgCyan(`Booting ${config.dirname} box...`))
  process.chdir(config.dirname)
  spawn.sync('vagrant', ['up'], { stdio: 'inherit' })

  // Run Setup!
  console.log(chalk.bgCyan(`Setting Up Wordpress...`))
  const setupCMD = 'cd /var/www && bash setup.sh'
  spawn.sync('vagrant', ['ssh', '-c', setupCMD], { stdio: 'inherit' })

  console.log(chalk.bgCyan('Done'))
})

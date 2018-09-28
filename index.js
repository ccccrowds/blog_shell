#! /usr/bin/env node

const program = require('commander')
const { render, add } = require('./index')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const Posts = require('./posts')
const config = require('./config')

const logError = msg => console.log(chalk.red(msg))

const getFilePath = name => path.join(config.root, 'source/_posts', name)

const getAllPosts = () => {
  const root = path.join(config.root, 'source/_posts')
  return fs.readdirSync(root)
    .filter(item => item.indexOf('.md') >= 0)
}
program
  .version('0.0.1')

program.command('import')
  .action(async p => {
    const posts = getAllPosts()

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      await new Posts().init(getFilePath(post))
    }
  })

program.command('add')
  .option('-n, --name [name]', '文章路径名称')
  .action(p => {
    p = p.name
    if (!p) {
      return logError('未输入文章路径名称')
    }
    new Posts(getFilePath(p))
  })

program.parse(process.argv)
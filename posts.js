const fs = require('fs')
const path = require('path')
const marked = require('marked')
const highlight = require('highlight.js')
const fetch = require('isomorphic-fetch')
const uploader = require('./uploader')
const log = require('./log')

const config = {
  url: 'http://39.107.86.47:8000/blog/',
  auth: 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0LCJ1c2VybmFtZSI6Imx4eTEyMyIsImV4cCI6MTUzMjg4NTA2NSwiZW1haWwiOm51bGx9.eyXixklr3WH5zP2HzIeTLJ-jirhGUaZHOK4G-LTKF48',
  category: 'http://39.107.86.47:8000/category/'
}

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  highlight: function(code) {
    return highlight.highlightAuto(code).value
  }
})

const catesHandler = cate => cate.trim()
  .replace(/\n/g, '')
  .split('-')
  .map(item => item.trim())
  .filter(item => item.length)

const handlers = {
  title: title => title.trim().replace(/\n/g, ''),
  date: date => date,
  categories: cate => catesHandler(cate)[0],
  tags: tag => catesHandler(tag)
}

const infoKeys = [
  'title',
  'date',
  'categories',
  'tags'
]

class Posts {
  constructor (name) {
    this.init(name)
  }
  async handleCategory (category) {
    const categories = await fetch(config.category, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())
    
    if (!categories.includes(category)) {
      log('分类中不包含分类：' + category)
      log('正在创建分类：' + category)
      await fetch(config.category, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: category,
          desc: category
        })
      })
    }
  }
  async init (name) {
    const file = this.readFile(name)
    const info = this.getInfo(file)
    const content = await this.getContent(file)
    const params = {
      "author": 3,
      "title": info.title,
      "body": marked(content.content),
      "excerpt": content.desc,
      "published":true,
      "commentabled":true,
      "category": info.categories,
      "tags": info.tags
    }
    await this.handleCategory(info.categories)
    this.send(params)
  }
  readFile (name) {
    const filePath = path.resolve(__dirname, name)
    const content = fs.readFileSync(filePath, 'utf8')
    return content
  }
  /**
   * 获取文章的内容
   * 将文章内部的图片进行上传，并替换为上传后的URL
   */
  async getContent (file) {
    const content = file.split('---')[2]
    const txt = await uploader.init(content)
    const more = '<!-- more -->'
    return {
      desc: txt.indexOf(more) >= 0 ? txt.split(more)[0].replace(/\n/g, '') : '',
      content: txt
    }
  }
  /**
   * 获取文章的标题，标签等相关信息
   */
  getInfo (file) {
    const info = file.split('---')[1].trim()
    const indexs = []
    const infoMap = {}
  
    infoKeys.forEach(item => {
      const idx = info.indexOf(item)
  
      if (idx >= 0) {
        indexs.push(idx)
      }
    })
    indexs.forEach((idx, i) => {
      const line = info.slice(idx, indexs[i + 1])
      const map = line.split(':')
      const name = map[0]
  
      infoMap[name] = handlers[name](map[1])
    })
    return infoMap
  }
  send (params) {
    return fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.auth,
      },
      body: JSON.stringify(params)
    }).then(res => res.json())
      .then(_ => {
        console.log('发布成功！')
      })
      .catch(_ => {
        console.log('发布失败')
      })
  }
}

module.exports = Posts
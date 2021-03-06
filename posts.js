const fs = require('fs')
const path = require('path')
const marked = require('marked')
const highlight = require('highlight.js')
const fetch = require('isomorphic-fetch')
const uploader = require('./uploader')
const log = require('./log')
const _ = require('lodash')
const config = require('./config')
const picture = require('./picture')

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
  getUrl (action) {
    return `${config.ip}:${config.port}${action}`
  }
  async handleCategory (category) {
    const url = this.getUrl(config.category)
    let ret = ''
    const categories = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())
      .then(res => res.data)
    const type = _.find(categories, item => item.name === category)

    if (type) {
      return type
    }

    log('分类中不包含分类：' + category)
    log('正在创建分类：' + category)

    return await fetch(url + '/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: category,
        desc: category
      })
    }).then(res => res.json())
      .then(res => {
        if (res.errno) return ''
        return res.data
      })
  }
  async handleTags (tags) {
    const url = this.getUrl(config.tag)
    const ret = []
    const currentTags = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())
      .then(res => res.data)
    
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      const t = _.find(currentTags, item => item.name === tag)
      if (t) {
        ret.push(t)
        continue
      }
      log('分类中不包含分类：' + tag)
      log('正在创建分类：' + tag)
      const r = await fetch(url + '/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: tag,
          desc: tag
        })
      }).then(res => res.json())
      .then(res => {
        if (res.errno) return ''
        return res.data
      })
      ret.push(r)
    }
    return _.uniq(ret, item => item && item.name).filter(item => item)
  }
  async init (name) {
    const { stat, content: file } = this.readFile(name)
    const info = this.getInfo(file)
    const content = await this.getContent(file)
    const type = await this.handleCategory(info.categories)
    const tags = await this.handleTags(info.tags)
    const thumb = await this.getThumb()
    const params = {
      // "author": config.author,
      "title": info.title,
      "content": marked(content.content),
      "desc": content.desc,
      // "published":true,
      // "commentabled":true,
      "type": type ? type._id : '',
      "tag": tags.map(item => item._id),
      "create_at": stat.birthtime,
      "update_at": stat.mtime,
      thumb
    }

    this.send(params)
  }
  readFile (name) {
    const filePath = path.resolve(__dirname, name)
    const stat = fs.statSync(filePath)
    const content = fs.readFileSync(filePath, 'utf8')
    return {
      stat,
      content
    }
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
  async getThumb () {
    const pic = await picture()
    return 'http://oowxefv5q.bkt.clouddn.com/' + pic.key
  }
  send (params) {
    const headers = {
      'Content-Type': 'application/json'
    }
    const url = this.getUrl(config.post)
    if (config.needAuth) {
      headers.Authorization = config.auth
    }
    return fetch(url, {
      method: 'POST',
      headers,
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
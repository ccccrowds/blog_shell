const path = require('path')
const fs = require('fs')
const request = require('request')
const FormData = require('form-data')
const fetch = require('isomorphic-fetch')
const log = require('./log')
const cache = require('./cache')

class Uploader {
  constructor () {
    this.config = {
      url: 'https://sm.ms/api/upload'
    }
  }
  /**
   * 从文章中获取图片路径
   */
  getImagesURL (content) {
    const pattern = /!\[(.*?)\]\((.*?)\)/mg
    const result = []
    let matcher

    while ((matcher = pattern.exec(content)) !== null) {
      result.push({
        alt: matcher[1],
        url: matcher[2]
      })
    }
    return result
  }
  getAbsolutePath (url) {
    return path.resolve(__dirname, './source', '.' + url)
  }
  /**
   * 上传图片到图床
   */
  upload (url) {
    if (cache.get(url)) {
      console.log(`${url}已经上传成功，直接读取`)
      return Promise.resolve().then(_ => cache.get(url))
    }
    const imagePath = this.getAbsolutePath(url)
    const formData = new FormData()
    formData.append('smfile', fs.createReadStream(imagePath))
    log(`正在上传${url}...`)
    return fetch(this.config.url, {
      method: 'POST',
      body: formData
    }).then(res => res.json())
      .then(res => {
        log(`上传${url}成功！`)
        cache.set(url, res)
        return res
      })
  }
  init (content) {
    let txt = content
    const urls = this.getImagesURL(content)
    const uploadReq = urls.map(item => this.upload(item.url))
    return Promise.all(uploadReq)
      .then(results => results.map((item, index) => {
        if (item.code === 'success') {
          txt = txt.replace(urls[index].url, item.data.url)
          return item.data.url
        }
        return ''
      }))
      .then(result => {
        return txt
      })
      .catch(err => {
        console.log(err)
      })
  }
}

module.exports = new Uploader()
const path = require('path')
const log = require('./log')
const cache = require('./cache')
const qiniu = require('qiniu')
const uuid = require('uuid/v1')
const c = require('./config')
const config = c.qiniu

const qiniuConfig = new qiniu.conf.Config()

const mac = new qiniu.auth.digest.Mac(config.ACCESS_KEY, config.SECRET_KEY);
const putPolicy = new qiniu.rs.PutPolicy({
  scope: config.Bucket_Name
});
const uploadToken=putPolicy.uploadToken(mac);
const putExtra = new qiniu.form_up.PutExtra()

qiniuConfig.zone = qiniu.zone.Zone_z2
qiniuConfig.useHttpsDomain = false
qiniuConfig.useCdnDomain = false

const qiniuUploader = new qiniu.form_up.FormUploader(qiniuConfig);

function upload(filePath) {
  return new Promise((resolve, reject) => {
    qiniuUploader.putFile(uploadToken, uuid(), filePath, putExtra, function(respErr,
      respBody, respInfo) {
      if (respErr) {
        return reject(respErr)
      }
      if (respInfo.statusCode == 200) {
        return resolve(respBody)
      } else {
        return reject(respBody)
      }
    })
  })
}

class Uploader {
  constructor () {
    this.config = {
      url: 'http://oowxefv5q.bkt.clouddn.com/'
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
      if (matcher[2].indexOf('http') < 0) {
        result.push({
          alt: matcher[1],
          url: matcher[2]
        })
      }
    }
    return result
  }
  getAbsolutePath (url) {
    return path.join(c.root, './source', '.' + url)
  }
  /**
   * 上传图片到图床
   */
  upload (url, isAbsolute) {
    if (cache.get(url)) {
      console.log(`${url}已经上传成功，直接读取`)
      return Promise.resolve().then(_ => cache.get(url))
    }
    const imagePath = isAbsolute ? url : this.getAbsolutePath(url)

    return upload(imagePath)
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
        const url = this.config.url + item.key
        txt = txt.replace(urls[index].url, url)
        return url
      }))
      .then(result => {
        return txt
      })
      .catch(err => {
        // console.log(err)
      })
  }
}

module.exports = new Uploader()
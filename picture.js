const fs = require('fs')
const gm = require('gm').subClass({imageMagick: true});
const path = require('path')
const sharp = require('sharp')
const uploader = require('./uploader')
const rm = require('rimraf')

const getPath = p => path.join(__dirname, './pic', p)
const resultPath = p => path.join(__dirname, './pic-result', p)
const baseWidth = 600

// if (!fs.existsSync(getPath('./pic-result'))) {
//   fs.mkdirSync('pic-result')
// }

function getFiles() {
  return fs.readdirSync('./pic')
}

function resize(path) {
  return sharp(getPath(path))
    .resize(baseWidth, null)
    .toFile(resultPath(path))
    .then(result => {
      return new Promise((resolve, reject) => {
        resolve(resultPath(path))
        // rm(getPath(path), err => {
        //   if (err) reject(err)
        //   resolve(resultPath(path))
        // })
      })
    })
}

function getRandomPic(files) {
  const length = files.length
  const index = parseInt(Math.random() * length)

  return files[index]
}



module.exports = function () {
  const files = getFiles()
  const file = getRandomPic(files)

  return resize(file).then(path => {
    return uploader.upload(path, true)
  })
}
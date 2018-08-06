const fs = require('fs')
const path = require('path')

const DEFAULT_CACHE_DIR = path.join(__dirname, './.cache')

class Cache {
  constructor(options = {}) {
    const cacheContent = fs.readFileSync(DEFAULT_CACHE_DIR, 'utf8')
    if (cacheContent) {
      this.cache = new Map(JSON.parse(cacheContent))
    } else {
      this.cache = new Map()
    }
  }

  get(key) {
    return this.cache.get(key)
  }

  set(key, value) {
    this.cache.set(key, value)
    this.flush()
  }

  has(key) {
    return this.cache.has(key)
  }

  clear() {
    this.cache.clear()
    this.flush()
  }

  flush() {
    fs.writeFileSync(
      DEFAULT_CACHE_DIR,
      JSON.stringify([...this.cache]),
      'utf8'
    )
  }
}

module.exports = new Cache()
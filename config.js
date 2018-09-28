module.exports = {
  root: '/Users/wangxiaoxin/Documents/Hexo',
  author: '',
  needAuth: true,
  ip: 'http://127.0.0.1',
  port: '8360',
  post: '/article/add',
  category: '/types',
  tag: '/tags',
  auth: 'JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjo0LCJ1c2VybmFtZSI6Imx4eTEyMyIsImV4cCI6MTUzMjg4NTA2NSwiZW1haWwiOm51bGx9.eyXixklr3WH5zP2HzIeTLJ-jirhGUaZHOK4G-LTKF48',
  qiniu: {
    'ACCESS_KEY': '4W-FKHsgiZKAqPPtdPtcH_cd1K3cxQspGIGh93T0', // https://portal.qiniu.com/user/key
    'SECRET_KEY': 'YWyHoeJIxeoJuBDRyYZh9Gxrn9KGq9bR0FuFwvsL',
    'Bucket_Name': 'blog-images',
    'Uptoken_Url': 'uptoken',
    'Domain': '<Your Bucket Name>' 
  }
}
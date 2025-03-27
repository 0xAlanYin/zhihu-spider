module.exports = {
  // 数据库配置
  database: {
    path: './data/zhihu.db'
  },
  // 爬虫配置
  crawler: {
    url: 'https://www.zhihu.com/hot',
    fetchInterval: 3600000, // 1小时
    fetchCount: 20,
    timeout: 30000, // 30秒
    headless: true // 是否隐藏浏览器
  },
  // 服务器配置
  server: {
    port: 3000
  },
  // 前端配置
  frontend: {
    port: 5173
  }
} 
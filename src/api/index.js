const express = require('express');
const cors = require('cors');
const db = require('../db');
const crawler = require('../crawler');
const config = require('../config/default');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 获取热点问题列表
app.get('/api/hot-questions', async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    
    // 查询数据
    const questions = await db.getHotQuestions({
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate
    });
    
    // 获取总数
    const total = await db.countHotQuestions({ startDate, endDate });
    
    res.json({
      success: true,
      data: {
        list: questions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('获取热点问题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热点问题失败',
      error: error.message
    });
  }
});

// 获取所有配置
app.get('/api/configs', async (req, res) => {
  try {
    const configs = await db.getAllConfigs();
    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败',
      error: error.message
    });
  }
});

// 更新配置
app.post('/api/configs', async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    const result = await db.updateConfig(key, value);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新配置失败',
      error: error.message
    });
  }
});

// 手动触发爬虫
app.post('/api/crawl', async (req, res) => {
  try {
    const result = await crawler.runCrawler();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('手动抓取失败:', error);
    res.status(500).json({
      success: false,
      message: '手动抓取失败',
      error: error.message
    });
  }
});

// 启动API服务
function startApiServer() {
  return new Promise((resolve, reject) => {
    const server = app.listen(config.server.port, () => {
      console.log(`API服务已启动，端口: ${config.server.port}`);
      resolve(server);
    });
    
    server.on('error', (error) => {
      console.error('API服务启动失败:', error);
      reject(error);
    });
  });
}

module.exports = {
  app,
  startApiServer
}; 
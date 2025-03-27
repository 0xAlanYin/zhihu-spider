const { chromium } = require('playwright');
const config = require('../config/default');
const db = require('../db');

/**
 * 解析cookie字符串为对象数组
 * @param {string} cookieStr cookie字符串
 * @returns {Array} cookie对象数组
 */
function parseCookies(cookieStr) {
  if (!cookieStr) return [];
  
  return cookieStr.split(';')
    .map(pair => {
      const [name, ...rest] = pair.trim().split('=');
      const value = rest.join('='); // 处理值中可能包含=的情况
      return { name, value, domain: '.zhihu.com', path: '/' };
    });
}

/**
 * 抓取知乎热点问题
 * @returns {Promise<Array>} 热点问题数组
 */
async function crawlHotQuestions() {
  const browser = await chromium.launch({
    headless: config.crawler.headless
  });
  
  try {
    const context = await browser.newContext();
    
    // 获取cookie并设置
    const cookieStr = await db.getConfig('cookies');
    const cookies = parseCookies(cookieStr);
    
    if (cookies.length > 0) {
      await context.addCookies(cookies);
    } else {
      console.warn('未设置cookies，可能无法正常访问知乎');
    }
    
    // 设置超时
    context.setDefaultTimeout(config.crawler.timeout);
    
    const page = await context.newPage();
    await page.goto(config.crawler.url, { waitUntil: 'networkidle' });
    
    // 检查是否被重定向到登录页面
    const currentUrl = page.url();
    if (currentUrl.includes('signin')) {
      throw new Error('需要登录知乎，请更新cookies');
    }
    
    // 等待热榜内容加载 - 更新为新的选择器
    await page.waitForSelector('.HotItem-content');
    
    // 获取抓取数量
    const fetchCountStr = await db.getConfig('fetchCount');
    const fetchCount = parseInt(fetchCountStr) || config.crawler.fetchCount;
    
    // 抓取热榜内容 - 更新为新的选择器和结构
    const questions = await page.$$eval(
      '.HotItem-content',
      (items, limit) => items.slice(0, limit).map((item, index) => {
        // 获取问题链接和标题
        const linkElem = item.querySelector('a');
        const url = linkElem ? linkElem.href : '';
        const question_id = url.split('/').pop();
        
        // 获取问题标题
        const titleElem = item.querySelector('.HotItem-title');
        const title = titleElem ? titleElem.textContent.trim() : '';
        
        // 获取摘要内容
        const excerptElem = item.querySelector('.HotItem-excerpt');
        const excerpt = excerptElem ? excerptElem.textContent.trim() : '';
        
        // 获取热度
        const heatElem = item.querySelector('.HotItem-metrics');
        const heat = heatElem ? heatElem.textContent.trim().replace(/分享$/, '') : '';
        
        return {
          question_id,
          title,
          url,
          excerpt,
          heat,
          rank: index + 1
        };
      }),
      fetchCount
    );
    
    return questions;
  } catch (error) {
    console.error('抓取知乎热榜失败:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * 开始定时抓取
 */
async function startCrawler() {
  try {
    // 获取抓取间隔
    const fetchIntervalStr = await db.getConfig('fetchInterval');
    const fetchInterval = parseInt(fetchIntervalStr) || config.crawler.fetchInterval;
    
    console.log(`开始抓取知乎热榜，间隔: ${fetchInterval}ms`);
    
    // 首次立即执行
    await runCrawler();
    
    // 设置定时任务
    setInterval(runCrawler, fetchInterval);
  } catch (error) {
    console.error('启动爬虫失败:', error);
  }
}

/**
 * 执行单次抓取
 */
async function runCrawler() {
  try {
    console.log(`[${new Date().toLocaleString()}] 开始抓取知乎热榜...`);
    
    const questions = await crawlHotQuestions();
    console.log(`成功获取 ${questions.length} 个热点问题`);
    
    // 保存到数据库
    const result = await db.saveHotQuestions(questions);
    console.log(`成功保存 ${result.inserted} 个新问题`);
    
    return { success: true, count: questions.length, inserted: result.inserted };
  } catch (error) {
    console.error('抓取失败:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  parseCookies,
  crawlHotQuestions,
  startCrawler,
  runCrawler
}; 
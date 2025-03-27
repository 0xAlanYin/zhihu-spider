const { parseCookies } = require('../src/crawler');

// 模拟一些依赖
jest.mock('../src/db', () => ({
  getConfig: jest.fn(),
  saveHotQuestions: jest.fn(),
  updateConfig: jest.fn()
}));

jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn()
  }
}));

const db = require('../src/db');
const { chromium } = require('playwright');
const crawler = require('../src/crawler');

describe('爬虫模块测试', () => {
  // Cookie解析测试
  test('应正确解析cookie字符串为对象数组', () => {
    const cookieStr = 'name1=value1; name2=value2; name3=value3=extra';
    const cookies = parseCookies(cookieStr);
    
    expect(cookies).toHaveLength(3);
    expect(cookies[0]).toEqual({
      name: 'name1',
      value: 'value1',
      domain: '.zhihu.com',
      path: '/'
    });
    expect(cookies[1]).toEqual({
      name: 'name2',
      value: 'value2',
      domain: '.zhihu.com',
      path: '/'
    });
    expect(cookies[2]).toEqual({
      name: 'name3',
      value: 'value3=extra',
      domain: '.zhihu.com',
      path: '/'
    });
  });
  
  test('空cookie字符串应返回空数组', () => {
    expect(parseCookies('')).toEqual([]);
    expect(parseCookies(null)).toEqual([]);
    expect(parseCookies(undefined)).toEqual([]);
  });
  
  // 爬虫执行测试
  test('爬虫执行成功应返回正确结果', async () => {
    // 模拟数据库返回cookie
    db.getConfig.mockResolvedValue('test_cookie=123');
    
    // 模拟保存热点问题结果
    db.saveHotQuestions.mockResolvedValue({ inserted: 5 });
    
    // 模拟浏览器上下文和页面
    const mockPage = {
      goto: jest.fn().mockResolvedValue(),
      waitForSelector: jest.fn().mockResolvedValue(),
      url: jest.fn().mockReturnValue('https://www.zhihu.com/hot'),
      $$eval: jest.fn().mockResolvedValue([
        { question_id: '1', title: '测试问题1', url: 'https://zhihu.com/question/1', excerpt: '摘要1', heat: '1000 万热度', rank: 1 },
        { question_id: '2', title: '测试问题2', url: 'https://zhihu.com/question/2', excerpt: '摘要2', heat: '500 万热度', rank: 2 }
      ])
    };
    
    const mockContext = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      addCookies: jest.fn().mockResolvedValue(),
      setDefaultTimeout: jest.fn()
    };
    
    const mockBrowser = {
      newContext: jest.fn().mockResolvedValue(mockContext),
      close: jest.fn().mockResolvedValue()
    };
    
    chromium.launch.mockResolvedValue(mockBrowser);
    
    // 模拟爬虫执行
    const result = await crawler.runCrawler();
    
    // 验证结果
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.inserted).toBe(5);
    
    // 验证浏览器操作
    expect(chromium.launch).toHaveBeenCalled();
    expect(mockBrowser.newContext).toHaveBeenCalled();
    expect(mockContext.addCookies).toHaveBeenCalled();
    expect(mockPage.goto).toHaveBeenCalled();
    expect(mockPage.waitForSelector).toHaveBeenCalledWith('.HotList-item');
    expect(mockPage.$$eval).toHaveBeenCalled();
    expect(mockBrowser.close).toHaveBeenCalled();
    
    // 验证数据库操作
    expect(db.getConfig).toHaveBeenCalledTimes(2); // cookies 和 fetchCount
    expect(db.saveHotQuestions).toHaveBeenCalled();
  });
  
  test('登录页面重定向应抛出错误', async () => {
    // 模拟数据库返回cookie
    db.getConfig.mockResolvedValue('test_cookie=123');
    
    // 模拟浏览器上下文和页面
    const mockPage = {
      goto: jest.fn().mockResolvedValue(),
      waitForSelector: jest.fn().mockResolvedValue(),
      url: jest.fn().mockReturnValue('https://www.zhihu.com/signin')
    };
    
    const mockContext = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      addCookies: jest.fn().mockResolvedValue(),
      setDefaultTimeout: jest.fn()
    };
    
    const mockBrowser = {
      newContext: jest.fn().mockResolvedValue(mockContext),
      close: jest.fn().mockResolvedValue()
    };
    
    chromium.launch.mockResolvedValue(mockBrowser);
    
    // 模拟爬虫执行
    const result = await crawler.runCrawler();
    
    // 验证结果
    expect(result.success).toBe(false);
    expect(result.error).toContain('需要登录知乎，请更新cookies');
    
    // 验证浏览器操作
    expect(chromium.launch).toHaveBeenCalled();
    expect(mockBrowser.close).toHaveBeenCalled();
  });
}); 
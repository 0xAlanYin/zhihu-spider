const db = require('../db');
const crawler = require('./index');

// 等待一段时间，确保数据库初始化完成
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试爬虫功能
async function testCrawler() {
  try {
    console.log('开始测试爬虫功能...');
    
    // 等待数据库初始化完成
    await wait(1000);
    
    // 1. 设置测试cookie
    const cookiesStr = `_zap=f74544fc-5aa2-4ec9-8e58-1ee4afb05ff6; d_c0=AuDZbYyAXRiPTrtNB0TN2aHNw-u24uyr0HA=|1711371682; __snaker__id=sUmMWc6LWR7ylqKK; q_c1=04775c90229c43819169fd3eca2f656b|1721100980000|1721100980000; _xsrf=5rBQTNbzubK0wN8r1wWlP5OIAAE82Fph; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1742040582; HMACCOUNT=D9AC3CCA93DB995C; SESSIONID=Ih0PpLFjfTFeHGvfD40OgUc5d1fvzRgNod5zNmiGEQc; JOID=W14RBEis6NEfOuXiYaKdClWwa7p06oLiS0CmpgjAs5V5dqibBbM1MnY_6ONmyUmLRZXLE4CtXrf7XXzzjmlQlqw=; osd=V10SAkig69IZOunhYqSdBlazbbp46YHkS0ylpQ7Av5Z6cKiXBrAzMno86-VmxUqIQ5XHEIOrXrv4XnrzgmpTkKw=; o_act=login; ref_source=other_https://www.zhihu.com/signin; expire_in=15552000; __zse_ck=004_yX=9rJxVR3MdH2nauLGC9iMR6bRBVDxeM62=HHGAR4jbrvJg7ko4EGPllSYI/qjJUkHeO7AcBUTggCiE5Es=djOkdB9AgqiOjAo2pQH48PU2tgap6qAzcCAKvS43pcg9-PIo1rSJYMGH1N+/CJtmKwCsgfo8HtAuOT7u+bR+RWzBVdyRWi51Sz49D4zQxN0Gj8r3uAye/hxGcskJmShBUs5ORRP7weP2n4d7KtbVDEMUudE5EMn+e1h5xUXtbF67q; tst=h; z_c0=2|1:0|10:1743081039|4:z_c0|92:Mi4xbTdfd0FBQUFBQUFDNE5sdGpJQmRHQ1lBQUFCZ0FsVk5UcHpTYUFBQkNZOGZMVG1iZGY2MHFMbTBmX1FxOUxPZVJB|edda059b01cbea3fdd7c97ad2ae5b425f31bbcc7cfe7f3d18ccb5caaf748be11; gdxidpyhxdE=Zyrpn16j9ow%2BO8GSqdOgante2YaKA%2B7Y1nNLIrkjK2lUvnN136nmydxnz7qiaH7SJOnQTTL3Z843IVw%2Bcd4x2KcyjEmjdpWh0SP0%2BpSkSEHyU1qbuj5%2B8%2BC6pYtwGHm%2FM3nVsyA0AqNfR%2FE1cO1Bipe55XDqqUSC2LEtywXl13mDIQ6%2F%3A1743082943661; BEC=0411444ca878fa9fb7a0adaad2449839; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1743082949`;
    await db.updateConfig('cookies', cookiesStr);
    console.log('已设置测试cookies');
    
    // 2. 执行爬虫
    const result = await crawler.runCrawler();
    
    if (result.success) {
      console.log(`测试成功: 获取到 ${result.count} 个问题, 新增 ${result.inserted} 个问题`);
      
      // 3. 查询数据库验证结果
      const questions = await db.getHotQuestions({ limit: 5 });
      console.log('\n前5个热点问题:');
      questions.forEach((q, i) => {
        console.log(`${i+1}. ${q.title} (${q.heat})`);
      });
    } else {
      console.error(`测试失败: ${result.error}`);
    }
  } catch (error) {
    console.error('测试过程中出错:', error);
  } finally {
    // 延迟关闭数据库连接，确保所有操作都完成
    setTimeout(async () => {
      try {
        await db.closeDatabase();
        console.log('数据库连接已关闭');
      } catch (err) {
        console.error('关闭数据库连接失败:', err);
      }
      process.exit(0);
    }, 1000);
  }
}

// 执行测试
testCrawler(); 
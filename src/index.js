const db = require('./db');
const api = require('./api');
const crawler = require('./crawler');
const { exec } = require('child_process');
const config = require('./config/default');

// 启动应用
async function startApp() {
  try {
    console.log('正在启动知乎热点问题采集系统...');
    
    // 1. 更新用户提供的cookies
    const cookiesStr = `_zap=f74544fc-5aa2-4ec9-8e58-1ee4afb05ff6; d_c0=AuDZbYyAXRiPTrtNB0TN2aHNw-u24uyr0HA=|1711371682; __snaker__id=sUmMWc6LWR7ylqKK; q_c1=04775c90229c43819169fd3eca2f656b|1721100980000|1721100980000; _xsrf=5rBQTNbzubK0wN8r1wWlP5OIAAE82Fph; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1742040582; HMACCOUNT=D9AC3CCA93DB995C; SESSIONID=Ih0PpLFjfTFeHGvfD40OgUc5d1fvzRgNod5zNmiGEQc; JOID=W14RBEis6NEfOuXiYaKdClWwa7p06oLiS0CmpgjAs5V5dqibBbM1MnY_6ONmyUmLRZXLE4CtXrf7XXzzjmlQlqw=; osd=V10SAkig69IZOunhYqSdBlazbbp46YHkS0ylpQ7Av5Z6cKiXBrAzMno86-VmxUqIQ5XHEIOrXrv4XnrzgmpTkKw=; o_act=login; ref_source=other_https://www.zhihu.com/signin; expire_in=15552000; __zse_ck=004_yX=9rJxVR3MdH2nauLGC9iMR6bRBVDxeM62=HHGAR4jbrvJg7ko4EGPllSYI/qjJUkHeO7AcBUTggCiE5Es=djOkdB9AgqiOjAo2pQH48PU2tgap6qAzcCAKvS43pcg9-PIo1rSJYMGH1N+/CJtmKwCsgfo8HtAuOT7u+bR+RWzBVdyRWi51Sz49D4zQxN0Gj8r3uAye/hxGcskJmShBUs5ORRP7weP2n4d7KtbVDEMUudE5EMn+e1h5xUXtbF67q; tst=h; z_c0=2|1:0|10:1743081039|4:z_c0|92:Mi4xbTdfd0FBQUFBQUFDNE5sdGpJQmRHQ1lBQUFCZ0FsVk5UcHpTYUFBQkNZOGZMVG1iZGY2MHFMbTBmX1FxOUxPZVJB|edda059b01cbea3fdd7c97ad2ae5b425f31bbcc7cfe7f3d18ccb5caaf748be11; gdxidpyhxdE=Zyrpn16j9ow%2BO8GSqdOgante2YaKA%2B7Y1nNLIrkjK2lUvnN136nmydxnz7qiaH7SJOnQTTL3Z843IVw%2Bcd4x2KcyjEmjdpWh0SP0%2BpSkSEHyU1qbuj5%2B8%2BC6pYtwGHm%2FM3nVsyA0AqNfR%2FE1cO1Bipe55XDqqUSC2LEtywXl13mDIQ6%2F%3A1743082943661; BEC=0411444ca878fa9fb7a0adaad2449839; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1743082949`;
    
    await db.updateConfig('cookies', cookiesStr);
    console.log('已更新cookies配置');
    
    // 2. 启动API服务器
    const server = await api.startApiServer();
    console.log(`API服务器已启动，端口: ${config.server.port}`);
    
    // 3. 启动爬虫
    await crawler.startCrawler();
    
    // 4. 启动前端开发服务器
    startFrontend();
    
    // 5. 监听进程退出信号
    process.on('SIGINT', async () => {
      console.log('正在关闭应用...');
      server.close();
      await db.closeDatabase();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('应用启动失败:', error);
    process.exit(1);
  }
}

// 启动前端开发服务器
function startFrontend() {
  const viteProcess = exec('npx vite', (error) => {
    if (error) {
      console.error('前端服务启动失败:', error);
      return;
    }
  });
  
  viteProcess.stdout.on('data', (data) => {
    console.log(`前端服务: ${data}`);
  });
  
  viteProcess.stderr.on('data', (data) => {
    console.error(`前端服务错误: ${data}`);
  });
  
  console.log(`前端服务器正在启动，端口: ${config.frontend.port}`);
}

// 启动应用
startApp(); 
# 知乎热点问题采集系统

这是一个简单的知乎热点问题采集系统，可以定期抓取知乎热榜的前20个问题，并存储到本地SQLite数据库中，同时提供简单的前端界面查看数据。

## 功能特点

- 使用Playwright模拟浏览器环境，支持登录态
- 定时抓取知乎热榜前20个问题
- 数据去重保存到SQLite数据库
- 提供简单的前端界面查看数据
- 可配置cookies、抓取数量、抓取间隔等参数

## 安装步骤

1. 安装Node.js环境(推荐v16+)
2. 克隆本仓库
3. 安装依赖

```bash
npm install
```

4. 安装Playwright浏览器

```bash
npx playwright install chromium
```

## 使用方法

### 启动系统

```bash
npm start
```

这将启动后端API服务和前端开发服务器。

- 后端API服务运行在 http://localhost:3000
- 前端界面运行在 http://localhost:5173

### 测试爬虫功能

```bash
node src/crawler/test.js
```

### 配置说明

系统启动后，可以通过前端界面的"系统配置"标签页修改以下配置：

- cookies: 知乎登录cookies
- fetchCount: 每次抓取的问题数量
- fetchInterval: 抓取间隔(毫秒)

## 目录结构

```
├── README.md
├── data/                  # 数据文件目录
│   └── zhihu.db           # SQLite数据库文件
├── src/
│   ├── api/               # API接口
│   ├── config/            # 配置文件
│   ├── crawler/           # 爬虫模块
│   ├── db/                # 数据库模块
│   ├── frontend/          # 前端界面
│   └── index.js           # 入口文件
└── package.json
```

## 注意事项

- 本系统依赖cookies方式实现知乎登录，需要手动更新cookies
- 爬虫行为需要遵守知乎的robots协议
- 系统仅供学习研究使用 
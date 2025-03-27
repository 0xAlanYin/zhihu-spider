const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../config/default');

// 确保数据目录存在
const dbDir = path.dirname(config.database.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new sqlite3.Database(config.database.path, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('成功连接到SQLite数据库');
    initDatabase();
  }
});

// 初始化数据库表
function initDatabase() {
  // 热点问题表
  db.run(`CREATE TABLE IF NOT EXISTS hot_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id TEXT UNIQUE,
    title TEXT,
    url TEXT,
    excerpt TEXT,
    heat TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rank INTEGER
  )`);

  // 配置表
  db.run(`CREATE TABLE IF NOT EXISTS configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT,
    description TEXT
  )`, function(err) {
    if (err) {
      console.error('创建配置表失败:', err.message);
    } else {
      // 初始化默认配置
      initDefaultConfigs();
    }
  });
}

// 初始化默认配置
function initDefaultConfigs() {
  const defaultConfigs = [
    {
      key: 'cookies',
      value: '',
      description: '知乎登录cookies'
    },
    {
      key: 'fetchCount',
      value: config.crawler.fetchCount.toString(),
      description: '每次抓取的问题数量'
    },
    {
      key: 'fetchInterval',
      value: config.crawler.fetchInterval.toString(),
      description: '抓取间隔(毫秒)'
    }
  ];

  // 使用事务批量插入
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare(`INSERT OR IGNORE INTO configs (key, value, description) VALUES (?, ?, ?)`);
    
    defaultConfigs.forEach(config => {
      stmt.run(config.key, config.value, config.description);
    });
    
    stmt.finalize();
    db.run('COMMIT');
  });
}

// 查询配置
function getConfig(key) {
  return new Promise((resolve, reject) => {
    db.get('SELECT value FROM configs WHERE key = ?', [key], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.value : null);
      }
    });
  });
}

// 更新配置
function updateConfig(key, value) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE configs SET value = ? WHERE key = ?', [value, key], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ key, value, changes: this.changes });
      }
    });
  });
}

// 获取所有配置
function getAllConfigs() {
  return new Promise((resolve, reject) => {
    db.all('SELECT key, value, description FROM configs', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 保存热点问题
function saveHotQuestions(questions) {
  return new Promise((resolve, reject) => {
    if (!questions || !questions.length) {
      return resolve({ inserted: 0 });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO hot_questions (question_id, title, url, excerpt, heat, rank)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      let inserted = 0;
      
      questions.forEach(q => {
        stmt.run(
          q.question_id,
          q.title,
          q.url,
          q.excerpt,
          q.heat,
          q.rank,
          function(err) {
            if (!err && this.changes > 0) {
              inserted++;
            }
          }
        );
      });
      
      stmt.finalize();
      db.run('COMMIT', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ inserted });
        }
      });
    });
  });
}

// 查询热点问题
function getHotQuestions(options = {}) {
  return new Promise((resolve, reject) => {
    const { page = 1, limit = 20, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM hot_questions';
    const params = [];
    
    // 添加日期筛选条件
    if (startDate || endDate) {
      query += ' WHERE';
      
      if (startDate) {
        query += ' created_at >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        query += startDate ? ' AND created_at <= ?' : ' created_at <= ?';
        params.push(endDate);
      }
    }
    
    // 添加排序和分页
    query += ' ORDER BY created_at DESC, rank ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 获取热点问题总数
function countHotQuestions(options = {}) {
  return new Promise((resolve, reject) => {
    const { startDate, endDate } = options;
    
    let query = 'SELECT COUNT(*) as total FROM hot_questions';
    const params = [];
    
    // 添加日期筛选条件
    if (startDate || endDate) {
      query += ' WHERE';
      
      if (startDate) {
        query += ' created_at >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        query += startDate ? ' AND created_at <= ?' : ' created_at <= ?';
        params.push(endDate);
      }
    }
    
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.total);
      }
    });
  });
}

// 关闭数据库连接
function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  db,
  getConfig,
  updateConfig,
  getAllConfigs,
  saveHotQuestions,
  getHotQuestions,
  countHotQuestions,
  closeDatabase
}; 
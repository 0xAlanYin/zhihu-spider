import React, { useState, useEffect } from 'react';
import { ConfigProvider, Layout, Menu, Table, DatePicker, Button, Form, Input, message, Typography, Space, Tabs, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// 后端API地址
const API_BASE_URL = 'http://localhost:3000/api';

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
};

// 主应用组件
function App() {
  const [activeTab, setActiveTab] = useState('1');
  
  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ position: 'fixed', zIndex: 1, width: '100%', color: 'white' }}>
          <Title level={3} style={{ color: 'white', margin: '14px 0' }}>知乎热点问题采集系统</Title>
        </Header>
        
        <Content style={{ padding: '0 50px', marginTop: 64 }}>
          <div style={{ padding: 24, minHeight: 380, background: '#fff', marginTop: 24 }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: '1',
                  label: '热点问题',
                  children: <HotQuestionsList />
                },
                {
                  key: '2',
                  label: '系统配置',
                  children: <ConfigPanel />
                }
              ]}
            />
          </div>
        </Content>
        
        <Footer style={{ textAlign: 'center' }}>知乎热点问题采集系统 ©2023</Footer>
      </Layout>
    </ConfigProvider>
  );
}

// 热点问题列表组件
function HotQuestionsList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [dateRange, setDateRange] = useState(null);
  
  // 表格列定义
  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a href={record.url} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      )
    },
    {
      title: '摘要',
      dataIndex: 'excerpt',
      key: 'excerpt',
      ellipsis: {
        showTitle: false
      },
      render: (text) => (
        <div style={{ maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={text}>
          {text}
        </div>
      )
    },
    {
      title: '热度',
      dataIndex: 'heat',
      key: 'heat',
      width: 120
    },
    {
      title: '采集时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: formatDate
    }
  ];
  
  // 加载数据
  const loadData = async (params = {}) => {
    setLoading(true);
    
    try {
      const queryParams = new URLSearchParams({
        page: params.page || pagination.current,
        limit: params.pageSize || pagination.pageSize
      });
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        queryParams.append('startDate', dateRange[0].toISOString());
        queryParams.append('endDate', dateRange[1].toISOString());
      }
      
      const response = await fetch(`${API_BASE_URL}/hot-questions?${queryParams}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data.list);
        setPagination({
          ...pagination,
          current: result.data.pagination.page,
          pageSize: result.data.pagination.limit,
          total: result.data.pagination.total
        });
      } else {
        message.error('加载数据失败');
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理表格变化
  const handleTableChange = (newPagination) => {
    loadData({
      page: newPagination.current,
      pageSize: newPagination.pageSize
    });
  };
  
  // 处理日期范围变化
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };
  
  // 手动触发爬虫
  const handleCrawl = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/crawl`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        message.success(`抓取成功，获取了${result.data.count}个问题，新增${result.data.inserted}个问题`);
        loadData(); // 重新加载数据
      } else {
        message.error(`抓取失败: ${result.data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('抓取失败:', error);
      message.error('抓取失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    loadData();
  }, []);
  
  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <RangePicker
          showTime
          onChange={handleDateRangeChange}
        />
        <Button type="primary" onClick={() => loadData()}>
          查询
        </Button>
        <Button type="primary" onClick={handleCrawl} loading={loading}>
          手动抓取
        </Button>
      </Space>
      
      <Table
        columns={columns}
        rowKey="id"
        dataSource={data}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
}

// 配置面板组件
function ConfigPanel() {
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [form] = Form.useForm();
  
  // 加载配置
  const loadConfigs = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/configs`);
      const result = await response.json();
      
      if (result.success) {
        setConfigs(result.data);
        
        // 设置表单初始值
        const initialValues = {};
        result.data.forEach(config => {
          initialValues[config.key] = config.value;
        });
        form.setFieldsValue(initialValues);
      } else {
        message.error('加载配置失败');
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 保存配置
  const handleSave = async (values) => {
    setLoading(true);
    
    try {
      const savePromises = Object.entries(values).map(([key, value]) => {
        return fetch(`${API_BASE_URL}/configs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ key, value })
        });
      });
      
      await Promise.all(savePromises);
      message.success('配置保存成功');
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    loadConfigs();
  }, []);
  
  return (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        style={{ maxWidth: 600 }}
      >
        {configs.map(config => (
          <Form.Item
            key={config.key}
            name={config.key}
            label={config.description}
            rules={[{ required: true, message: `请输入${config.description}` }]}
          >
            {config.key === 'cookies' ? (
              <TextArea rows={6} />
            ) : (
              <Input />
            )}
          </Form.Item>
        ))}
        
        <Form.Item>
          <Button type="primary" htmlType="submit">
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
}

export default App; 
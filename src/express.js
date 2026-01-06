// Express 入口文件，仅用于 Node.js 环境
import express from 'express';
import { getVideoData } from './index.js';

// 创建Express应用
const app = express();
const PORT = 7788;

// 定义API路由（Express）
app.get('/api/video', async (req, res) => {
  try {
    // 获取查询参数中的URL
    const { url } = req.query;
    
    // 验证URL是否提供
    if (!url) {
      return res.status(400).json({
        success: false,
        message: '缺少视频URL参数'
      });
    }
    
    // 获取视频数据
    const data = await getVideoData(url);
    
    // 返回成功响应
    res.json({
      success: true,
      data
    });
  } catch (error) {
    // 返回错误响应
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 健康检查路由（Express）
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 视频VIP分析API服务器启动成功！`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📖 健康检查: http://localhost:${PORT}/health`);
  console.log(`💡 使用示例: http://localhost:${PORT}/api/video?url=https://www.iqiyi.com/v_bb6gsxzz78.html`);
});

// 导出Express应用
export { app };

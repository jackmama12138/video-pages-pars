// 引入依赖
import { detectVideoPlatform, extractQQVideoCid } from './utils/index.js';
import { main as iqiyiHandler } from './utils/iqiyi.js';
import { main as qqHandler } from './utils/qq.js';
import { main as mgtvHandler } from './utils/mgtv.js';
import { main as youkuHandler } from './utils/youku.js';
import { Hono } from 'hono';

/**
 * 视频平台处理映射
 */
const PLATFORM_HANDLERS = {
  iqiyi: iqiyiHandler,
  qq: qqHandler,
  mgtv: mgtvHandler,
  youku: youkuHandler,
};

/**
 * 数据格式化映射
 */
const FORMATTERS = {
  iqiyi: (data) => ({
    platform: 'iqiyi',
    videoType: data.type,
    count: data.count,
    list: data.list
  }),
  qq: (data) => ({
    platform: 'qq',
    videoType: '未知', // QQ数据中没有直接提供视频类型
    count: data.length,
    list: data
  }),
  mgtv: (data) => ({
    platform: 'mgtv',
    videoType: '未知',
    count: data.length,
    list: data
  }),
  youku: (data) => ({
    platform: 'youku',
    videoType: '未知',
    count: data.length,
    list: data
  }),
};

/**
 * 从URL中提取平台所需参数
 * @param {string} url - 视频URL
 * @param {string} platform - 平台名称
 * @returns {string} - 提取的参数
 */
const extractPlatformParams = (url, platform) => {
  if (platform === 'qq') {
    return extractQQVideoCid(url);
  }
  // 爱奇艺、芒果和优酷直接使用URL
  return url;
};

/**
 * 统一获取视频数据函数
 * @param {string} url - 视频URL
 * @returns {Promise<Object>} - 统一格式的视频数据
 */
const getVideoData = async (url) => {
  try {
    // 1. 自动识别平台
    const platform = detectVideoPlatform(url);
    
    if (platform === 'unknown') {
      throw new Error(`无法识别视频平台: ${url}`);
    }
    
    // 2. 检查平台是否支持
    if (!PLATFORM_HANDLERS[platform]) {
      throw new Error(`暂不支持该平台: ${platform}`);
    }
    
    // 3. 提取平台所需参数
    const params = extractPlatformParams(url, platform);
    
    // 4. 调用平台处理函数获取原始数据
    const rawData = await PLATFORM_HANDLERS[platform](params);
    // 5. 转换为统一数据结构
    return FORMATTERS[platform](rawData);
  } catch (error) {
    console.error(`处理视频URL失败: ${url}`, error);
    throw error;
  }
};

// 创建Hono应用用于Cloudflare Workers
const honoApp = new Hono();

// 定义API路由（Hono）
honoApp.get('/api/video', async (c) => {
  try {
    // 获取查询参数中的URL
    const url = c.req.query('url');
    
    // 验证URL是否提供
    if (!url) {
      return c.json({
        success: false,
        message: '缺少视频URL参数'
      }, 400);
    }
    
    // 获取视频数据
    const data = await getVideoData(url);
    
    // 返回成功响应
    return c.json({
      success: true,
      data
    });
  } catch (error) {
    // 返回错误响应
    return c.json({
      success: false,
      message: error.message
    }, 500);
  }
});

// 健康检查路由（Hono）
honoApp.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 导出用于Cloudflare Workers的fetch函数
export default {
  fetch: honoApp.fetch
};

// 导出getVideoData函数供其他模块使用
export { getVideoData };

/**
 * 芒果视频API处理模块
 */
import axios from "axios";

/**
 * 从芒果视频URL中提取视频ID
 * @param {string} url - 视频URL
 * @returns {string|null} - 视频ID或null
 */
const getVideoId = (url) => {
  try {
    if (typeof url !== 'string') return null;

    // 支持多种URL格式
    const patterns = [
      /\/b\/\d+\/(\d+)(?=\.html|\?|$)/,
      /\/(\d+)\.html/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error('提取芒果视频ID失败:', error);
    return null;
  }
};

/**
 * 请求芒果视频API获取剧集数据
 * @param {string} video_id - 视频ID
 * @returns {Array|null} - 剧集数据或null
 */
const requestPage = async (video_id) => {
  try {
    const url = `https://pcweb.api.mgtv.com/episode/list?_support=10000000&version=5.5.35&video_id=${video_id}&page=0&size=40&platform=4&src=mgtv&allowedRC=1`;
    
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'Referer': 'https://www.mgtv.com/'
      }
    });

    if (res.data?.code !== 200) {
      console.error('芒果视频API请求失败:', res.data?.msg || '未知错误');
      return null;
    }

    return res.data?.data?.list || null;
  } catch (error) {
    console.error('请求芒果视频数据失败:', error);
    return null;
  }
};

/**
 * 解析剧集数据
 * @param {Array} data - 原始剧集数据
 * @returns {Array} - 解析后的剧集列表
 */
const parseItems = (data) => {
  try {
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter(item => item && item.isIntact === '1')
      .map(item => ({
        tag: item.t2 || '',
        title: item.t1 || '',
        url: item.url ? `https://www.mgtv.com${item.url}` : ''
      }))
      .filter(item => item.url); // 过滤无效URL
  } catch (error) {
    console.error('解析芒果视频数据失败:', error);
    return [];
  }
};

/**
 * 主入口函数
 * @param {string} url - 视频URL
 * @returns {Promise<Array|null>} - 解析后的剧集列表或null
 */
const main = async (url) => {
  try {
    const video_id = getVideoId(url);
    if (!video_id) {
      console.error('无法从URL中提取芒果视频ID');
      return null;
    }

    const data = await requestPage(video_id);
    if (!data) {
      console.error('获取芒果视频数据失败');
      return null;
    }

    const result = parseItems(data);
    return result.length > 0 ? result : null;
  } catch (error) {
    console.error('处理芒果视频失败:', error);
    return null;
  }
};

// 测试示例
// main('https://www.mgtv.com/b/641700/23845752.html?fpa=1261&fpos=&lastp=ch_home&cpid=5')
//   .then(items => console.log(items))
//   .catch(error => console.error(error));

export { main };
export default { main };
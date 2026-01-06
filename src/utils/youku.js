/**
 * 优酷视频API处理模块
 */
import axios from "axios";

/**
 * 从优酷视频URL中提取视频ID
 * @param {string} url - 视频URL
 * @returns {string|null} - 视频ID或null
 */
const getYoukuVideoId = (url) => {
  try {
    if (typeof url !== 'string') return null;

    const match = url.match(/id_([^.=]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('提取优酷视频ID失败:', error);
    return null;
  }
};

/**
 * 获取优酷视频的show_id
 * @param {string} video_id - 视频ID
 * @returns {string|null} - show_id或null
 */
const getYoukuShowId = async (video_id) => {
  try {
    if (!video_id) return null;

    const url = `https://openapi.youku.com/v2/videos/show.json?video_id=${video_id}&client_id=53e6cc67237fc59a&package=com.huawei.hwvplayer.youku&ext=show`;
    
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'Referer': 'https://v.youku.com/'
      }
    });

    return res.data?.show?.id || null;
  } catch (error) {
    console.error('获取优酷show_id失败:', error);
    return null;
  }
};

/**
 * 获取优酷剧集数据
 * @param {string} show_id - show_id
 * @returns {Array|null} - 剧集数据或null
 */
const getPageData = async (show_id) => {
  try {
    if (!show_id) return null;

    const url = `https://openapi.youku.com/v2/shows/videos.json?show_id=${show_id}&show_videotype=%E6%AD%A3%E7%89%87&page=1&count=40&client_id=0dec1b5a3cb570c1&package=com.huawei.hwvplayer.youku`;
    
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'Referer': 'https://v.youku.com/'
      }
    });

    return res.data?.videos || null;
  } catch (error) {
    console.error('获取优酷剧集数据失败:', error);
    return null;
  }
};

/**
 * 解析优酷剧集数据
 * @param {Array} data - 原始剧集数据
 * @returns {Array} - 解析后的剧集列表
 */
const parseItems = (data) => {
  try {
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map(item => ({
        tag: item.rc_title || '',
        title: item.seq || '',
        url: item.link || ''
      }))
      .filter(item => item.url); // 过滤无效URL
  } catch (error) {
    console.error('解析优酷剧集数据失败:', error);
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
    const video_id = getYoukuVideoId(url);
    if (!video_id) {
      console.error('无法从URL中提取优酷视频ID');
      return null;
    }

    const show_id = await getYoukuShowId(video_id);
    if (!show_id) {
      console.error('获取优酷show_id失败');
      return null;
    }

    const videos = await getPageData(show_id);
    if (!videos) {
      console.error('获取优酷剧集数据失败');
      return null;
    }

    const result = parseItems(videos);
    return result.length > 0 ? result : null;
  } catch (error) {
    console.error('处理优酷视频失败:', error);
    return null;
  }
};

// 测试示例
// main('https://v.youku.com/v_show/id_XNjQ1NDI4ODY2MA==.html?spm=a2hkl.14919748_WEBHOME_HOME.scg_scroll_3.d_3_play&s=aefa5bc564b44f50ae4d&scm=20140719.rcmd.feed.show_aefa5bc564b44f50ae4d&alginfo=-1reqId-293f378eb.21a5.47c4.9889.8c8b368b5f2d_1767721748581-1sceneId-246595-1seqId-20MRhJAN0CkhW5AGm-1abId-2468080&scg_id=616419')
//   .then(items => console.log(items))
//   .catch(error => console.error(error));

export { main };
export default { main };
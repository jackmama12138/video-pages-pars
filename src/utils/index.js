import axios from 'axios';
import crypto from 'node:crypto';

/**
 * 检测视频平台
 * @param {string} url - 视频的URL
 * @returns {string} - 返回视频平台名称（qq、iqiyi、youku、mgtv或unknown）
 * */
const detectVideoPlatform = (url) => {
	const u = new URL(url)
	switch (u.hostname) {
		case 'v.qq.com':
			return 'qq'
		case 'www.iqiyi.com':
			return 'iqiyi'
		case 'v.youku.com':
			return 'youku'
		case 'www.mgtv.com':
			return 'mgtv'
		default:
			return 'unknown'
	}
}



const extractQQVideoCid = (url) => {
	const u = new URL(url)
	return u.pathname.split('/')[3]
}




// 导出函数（ESM）
export { 
  detectVideoPlatform,
  extractQQVideoCid,
};


// ESM 自执行检测（仅在Node.js环境中）
if (typeof process !== 'undefined' && process.argv && import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  main('https://www.iqiyi.com/v_1t8mrh02hcs.html')
    .then(data => console.log(data))
    .catch(console.error);
}




import axios from 'axios';
import crypto from 'node:crypto';

/**
 * 视频类型枚举（爱奇艺 cid）
 */
const ENUM_VIDEO_TYPE = {
	1: '电影',
	2: '剧集',
	3: '纪录片',
	4: '动漫',
	6: '综艺',
	15: '少儿'
};

/**
 * MD5 签名（爱奇艺 selector 接口）
 */
const MD5 = (params) =>
	crypto.createHash('md5').update(params).digest('hex').toUpperCase();

/**
 * 获取 tvid（从 accelerator.js 中提取）
 */
const getTvid = async (refer) => {
	try {
		const url =
			'https://www.iqiyi.com/prelw/player/lw/lwplay/accelerator.js?apiVer=3&lwaver=14.011.24181&appver=14.011.24181';

		const { data } = await axios.get(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
				Referer: refer
			},
			timeout: 10000
		});

		const match = data.match(/"tvId":(\d+)/);
		if (!match) {
			throw new Error('无法从 accelerator.js 中解析 tvid');
		}

		return match[1];
	} catch (err) {
		throw new Error(`getTvid 失败：${err.message}`);
	}
};

/**
 * 获取视频基础信息
 * - 如果是剧集，返回 albumId
 * - 如果是电影 / 非剧集，直接返回视频信息数组
 */
const getVideoInfo = async (tvid) => {
	try {
		const url = `https://mesh.if.iqiyi.com/player/pcw/video/playervideoinfo?id=${tvid}&locale=zh_cn`;

		const { data } = await axios.get(url, { timeout: 10000 });

		if (data?.msg !== 'success') {
			throw new Error('video info 接口返回失败');
		}

		const info = data.data;
		const cid = info.cid;

		// 剧集（cid === 2）
		if (cid === 2) {
			return {
				type: 'series',
				albumId: info.albumId,
				videoType: ENUM_VIDEO_TYPE[cid]
			};
		}

		// 电影 / 其他
		return {
			type: 'single',
			videoType: ENUM_VIDEO_TYPE[cid] || '未知',
			list: [
				{
					title: info.shortTitle,
					tag: info.subt,
					url: info.vu
				}
			]
		};
	} catch (err) {
		throw new Error(`getVideoInfo 失败：${err.message}`);
	}
};

/**
 * 获取剧集分页数据
 */
const getPageInfo = async (albumId) => {
	try {
		const url = 'https://mesh.if.iqiyi.com/tvg/v2/selector?';

		const params = `album_id=${albumId}&src=lw&timestamp=${Date.now()}&secret_key=howcuteitis`;
		const sign = MD5(params);

		const { data } = await axios.get(url + params + '&sign=' + sign, {
			timeout: 10000
		});

		const videos = data?.data?.videos;
		if (!videos) {
			throw new Error('selector 返回数据异常');
		}

		const { page_keys, feature_paged } = videos;

		const resArrs = [];
		for (const key of page_keys) {
			if (feature_paged[key]) {
				resArrs.push(...feature_paged[key]);
			}
		}

		return parseItems(resArrs);
	} catch (err) {
		throw new Error(`getPageInfo 失败：${err.message}`);
	}
};

/**
 * 解析剧集条目
 */
const parseItems = (data) =>
	data
		.filter(item => item.content_type === 1)
		.map(item => ({
			title: item.album_order,
			tag: item.subtitle,
			url: item.page_url
		}));

/**
 * 主流程
 */
const main = async (refer) => {
	try {
		// 1. 获取 tvid
		const tvid = await getTvid(refer);

		// 2. 判断视频类型
		const videoInfo = await getVideoInfo(tvid);

		// 3. 剧集 → 拉全集
		if (videoInfo.type === 'series') {
			const list = await getPageInfo(videoInfo.albumId);
			return {
				type: videoInfo.videoType,
				count: list.length,
				list
			};
		}

		// 4. 电影 / 单视频
		return {
			type: videoInfo.videoType,
			count: videoInfo.list.length,
			list: videoInfo.list
		};
	} catch (err) {
		console.error(err.message);
		return null;
	}
};

/**
 * 执行（ESM）
 */
if (typeof process !== 'undefined' && process.argv && import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  main('https://www.iqiyi.com/v_bb6gsxzz78.html')
    .then(res => console.log(JSON.stringify(res, null, 2)))
    .catch(console.error);
}

// ESM 导出
export { main };
export default { main };

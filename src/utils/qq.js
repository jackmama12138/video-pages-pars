import axios from 'axios';

/**
 * 请求单个页面数据（第一页 / tab 页）
 */
const requestPage = async (cid, page_context = '') => {
	const { data } = await axios({
		method: 'post',
		url: 'https://pbaccess.video.qq.com/trpc.universal_backend_service.page_server_rpc.PageServer/GetPageData?vdevice_guid=588010f7b30f6afe&video_appid=3000010&vversion_name=8.2.96&vversion_platform=2',
		headers: {
			referer: 'https://v.qq.com/',
			'user-agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
			'content-type': 'application/json'
		},
		// axios 会自动 JSON.stringify
		data: {
			page_params: {
				req_from: 'web_vsite',
				page_id: 'vsite_episode_list',
				page_type: 'detail_operation',
				id_type: '1',
				cid,
				page_context,
				detail_page_type: '1'
			},
			has_cache: 1
		}
	});

	return data?.data?.module_list_datas?.[0]?.module_datas?.[0] || {};
};

/**
 * 解析 tabs（如果存在）
 */
const parseTabs = (moduleData) => {
	const tabsStr = moduleData?.module_params?.tabs;
	if (!tabsStr) return null;

	try {
		return JSON.parse(tabsStr);
	} catch {
		return null;
	}
};

/**
 * 解析视频列表
 */
const parseItems = (moduleData) => {
	const items = moduleData?.item_data_lists?.item_datas || [];

	return items
		.filter(item => item.item_params?.is_trailer === '0')
		.map(item => ({
			tag: item.item_params.video_subtitle,
			title: item.item_params.title,
			url: `https://v.qq.com/x/cover/${item.item_params.cid}/${item.item_params.vid}.html`
		}));
};

/**
 * 主入口
 */
const main = async (cid) => {
	// 请求第一页
	const firstPage = await requestPage(cid);

	const tabs = parseTabs(firstPage);

	// 没有 tabs，说明只有一页
	if (!tabs) {
		return parseItems(firstPage);
	}

	// 并发请求所有 tab 页面
	const pages = await Promise.all(
		tabs.map(tab => requestPage(cid, tab.page_context))
	);

	// 合并所有结果
	return pages.flatMap(parseItems);
};

/**
 * 执行（ESM）
 */
if (typeof process !== 'undefined' && process.argv && import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  main('aeuz5ypnru0wxqq')
    .then(data => {
      console.log('共获取视频数:', data.length);
      console.log(data);
    })
    .catch(console.error);
}

// ESM 导出
export { main };
export default { main };

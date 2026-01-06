import axios from "axios";

const getVideoId = (url)=> {
	if (typeof url !== 'string') return null;

	const match = url.match(/\/b\/\d+\/(\d+)(?=\.html|\?|$)/);
	return match ? match[1] : null;
}

const requestPage = async (video_id)=>{
	const url = `https://pcweb.api.mgtv.com/episode/list?_support=10000000&version=5.5.35&video_id=${video_id}&page=0&size=40&platform=4&src=mgtv&allowedRC=1`
	const res = await axios.get(url);
	// console.log(res.data.data)
	return res.data?.data?.list;
}

const parseItems = (data)=>{
	return  data.filter(item=>item.isIntact === '1')
	.map(item=>({
		tag: item.t2,
		title: item.t1,
		url: `https://www.mgtv.com${item.url}`
	}))

}

const main = async (url)=>{
	const video_id = getVideoId(url);
	if (!video_id) return null;

	const data = await requestPage(video_id);
	return parseItems(data);
}

// main('https://www.mgtv.com/b/641700/23845752.html?fpa=1261&fpos=&lastp=ch_home&cpid=5').then(items=>{
// 	console.log(items);
// })

export { main };
export default { main };
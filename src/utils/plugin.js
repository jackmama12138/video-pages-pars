// ==UserScript== 
// @name         努力鸭 
// @namespace    qq-episode-fill-search 
// @version      1.2.0 
// @description  努力鸭 
// @match        https://www.nuliya.top/vip/ 
// @grant        GM_xmlhttpRequest 
// @connect      video.026dd.icu 
// ==/UserScript== 

(function () { 
  'use strict' 

  /******************** UI ********************/ 
  const panel = document.createElement('div') 
  panel.style.cssText = ` 
    position: fixed; 
    right: 20px; 
    bottom: 20px; 
    width: 360px; 
    background: #0f0f0f; 
    color: #fff; 
    z-index: 999999; 
    padding: 12px; 
    border-radius: 10px; 
    font-size: 12px; 
    box-shadow: 0 8px 24px rgba(0,0,0,.45); 
  ` 

  panel.innerHTML = ` 
    <div style="font-weight:600;font-size:13px;margin-bottom:8px;"> 
      QQ 选集工具 
    </div> 

    <input 
      id="video-url" 
      placeholder="粘贴 QQ 视频 URL" 
      style=" 
        width:100%; 
        padding:6px; 
        margin-bottom:8px; 
        border-radius:6px; 
        border:none; 
        outline:none; 
      " 
    /> 

    <button 
      id="fetch-btn" 
      style=" 
        width:100%; 
        padding:6px; 
        margin-bottom:10px; 
        border-radius:6px; 
        border:none; 
        cursor:pointer; 
      " 
    > 
      获取选集 
    </button> 

    <div 
      id="episode-list" 
      style=" 
        display:grid; 
        grid-template-columns:repeat(5, 1fr); 
        gap:6px; 
      " 
    ></div> 
  ` 

  document.body.appendChild(panel) 

  /******************** API ********************/ 
  const fetchEpisodes = (url) => { 
    return new Promise((resolve, reject) => { 
      GM_xmlhttpRequest({ 
        method: 'GET', 
        url: `https://video.026dd.icu/api/video?url=${encodeURIComponent(url)}`, 
        onload(res) { 
          try { 
            const data = JSON.parse(res.responseText);
            // 解析返回的数据结构，提取视频列表
            resolve(data.success ? data.data.list : []);
          } catch (e) { 
            reject(e); 
          } 
        }, 
        onerror: reject 
      }) 
    }) 
  } 

  /******************** 填充搜索框 ********************/ 
  const fillSearchInput = (url) => { 
    const searchBox = document.querySelector('.mod_search') 
    const btn = document.querySelector('.btn-play') 
    if (!searchBox || !searchBox.childNodes[1]) { 
      console.warn('[QQ Episode] 未找到 .mod_search 输入框') 
      return 
    } 
    searchBox.childNodes[1].value = url 
    btn.click() 
  } 

  /******************** 渲染列表 ********************/ 
  // 新增：记录当前选中的按钮 
  let activeBtn = null 

  const renderList = (list) => { 
    const container = document.getElementById('episode-list') 
    container.innerHTML = '' 
    // 重置选中状态 
    activeBtn = null 

    if (!Array.isArray(list) || !list.length) { 
      container.innerHTML = `<div style="color:#888;">无数据</div>` 
      return 
    } 

    list.forEach((item) => { 
      const btn = document.createElement('div') 
      btn.textContent = item.title 
      btn.title = item.tag || '' 
      btn.style.cssText = ` 
        text-align:center; 
        padding:6px 0; 
        background:#1c1c1c; 
        border-radius:6px; 
        cursor:pointer; 
        transition:.15s; 
      ` 

      btn.onmouseenter = () => { 
        // 鼠标移入：非选中状态才改变背景 
        if (btn !== activeBtn) { 
          btn.style.background = '#333' 
        } 
      } 

      btn.onmouseleave = () => { 
        // 鼠标移出：非选中状态恢复默认背景 
        if (btn !== activeBtn) { 
          btn.style.background = '#1c1c1c' 
        } 
      } 

      btn.onclick = () => { 
        // 新增：移除上一个选中按钮的高亮样式 
        if (activeBtn) { 
          activeBtn.style.background = '#1c1c1c' 
          activeBtn.style.color = '#fff' 
          activeBtn.style.fontWeight = 'normal' 
        } 

        // 新增：设置当前按钮为选中状态并添加高亮样式 
        activeBtn = btn 
        btn.style.background = '#0078ff' // 高亮背景色（蓝色） 
        btn.style.color = '#ffffff'      // 高亮文字色 
        btn.style.fontWeight = '600'     // 加粗文字 

        fillSearchInput(item.url) 
      } 

      container.appendChild(btn) 
    }) 
  } 

  /******************** 事件 ********************/ 
  document.getElementById('fetch-btn').onclick = async () => { 
    const url = document.getElementById('video-url').value.trim() 
    if (!url) { 
      alert('请输入视频 URL') 
      return 
    } 

    document.getElementById('episode-list').innerHTML = '加载中...' 

    try { 
      const list = await fetchEpisodes(url) 
      renderList(list) 
    } catch (e) { 
      console.error('获取失败', e) 
      document.getElementById('episode-list').innerHTML = '获取失败' 
    } 
  } 
})() 
